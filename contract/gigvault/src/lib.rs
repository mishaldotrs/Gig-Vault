//! GigVault — a freelance marketplace contract with:
//!   * milestone-based escrow (funds locked per-milestone, released on approval)
//!   * dispute arbitration (a designated arbitrator resolves contested milestones)
//!   * skill-based reputation scoring (on-chain score derived from completed /
//!     disputed work, tagged by skill)
#![no_std]

use soroban_sdk::{
    contract, contracterror, contractimpl, contracttype, symbol_short, token, Address, Env, String,
    Symbol, Vec,
};

// ---------------------------------------------------------------------------
// Storage keys
// ---------------------------------------------------------------------------

#[contracttype]
#[derive(Clone)]
pub enum DataKey {
    Admin,
    Arbitrator,
    Token,
    GigCount,
    Gig(u64),
    Reputation(Address),
}

const LEDGER_BUMP: u32 = 120_960; // ~7 days at 5s/ledger
const LEDGER_THRESHOLD: u32 = 100_800; // ~6 days

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

#[contracttype]
#[derive(Clone, Copy, PartialEq, Debug)]
pub enum GigStatus {
    Open = 0,
    InProgress = 1,
    Completed = 2,
    Cancelled = 3,
}

#[contracttype]
#[derive(Clone, Copy, PartialEq, Debug)]
pub enum MilestoneStatus {
    Pending = 0,   // created, not yet funded
    Funded = 1,    // escrowed in the contract
    Submitted = 2, // freelancer marked work delivered
    Released = 3,  // client approved, funds paid to freelancer
    Disputed = 4,  // under arbitration
    Refunded = 5,  // arbitrator/client returned funds to client
}

#[contracttype]
#[derive(Clone)]
pub struct Milestone {
    pub description: String,
    pub amount: i128,
    pub status: MilestoneStatus,
}

#[contracttype]
#[derive(Clone)]
pub struct Gig {
    pub id: u64,
    pub client: Address,
    pub freelancer: Option<Address>,
    pub title: String,
    pub skill: Symbol,
    pub status: GigStatus,
    pub milestones: Vec<Milestone>,
    pub created_at: u64,
}

#[contracttype]
#[derive(Clone)]
pub struct Reputation {
    pub skill: Symbol,
    pub completed: u32,
    pub disputed_won: u32,
    pub disputed_lost: u32,
    pub total_earned: i128,
    pub score: u32, // 0-1000, weighted composite
}

// ---------------------------------------------------------------------------
// Errors
// ---------------------------------------------------------------------------

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum GigVaultError {
    AlreadyInitialized = 1,
    NotInitialized = 2,
    GigNotFound = 3,
    MilestoneNotFound = 4,
    NotClient = 5,
    NotFreelancer = 6,
    NotArbitrator = 7,
    GigNotOpen = 8,
    GigNotInProgress = 9,
    InvalidMilestoneStatus = 10,
    EmptyMilestones = 11,
    InvalidAmount = 12,
    AlreadyAccepted = 13,
    Unauthorized = 14,
}

// ---------------------------------------------------------------------------
// Contract
// ---------------------------------------------------------------------------

#[contract]
pub struct GigVaultContract;

#[contractimpl]
impl GigVaultContract {
    /// One-time setup. `arbitrator` resolves disputes, `token` is the SAC
    /// (e.g. testnet USDC or native XLM wrapper) used for all escrow.
    pub fn initialize(
        env: Env,
        admin: Address,
        arbitrator: Address,
        token: Address,
    ) -> Result<(), GigVaultError> {
        if env.storage().instance().has(&DataKey::Admin) {
            return Err(GigVaultError::AlreadyInitialized);
        }
        admin.require_auth();
        env.storage().instance().set(&DataKey::Admin, &admin);
        env.storage()
            .instance()
            .set(&DataKey::Arbitrator, &arbitrator);
        env.storage().instance().set(&DataKey::Token, &token);
        env.storage().instance().set(&DataKey::GigCount, &0u64);
        env.storage()
            .instance()
            .extend_ttl(LEDGER_THRESHOLD, LEDGER_BUMP);

        env.events()
            .publish((symbol_short!("init"),), admin.clone());
        Ok(())
    }

    /// Client posts a new gig with a list of milestone payment amounts.
    pub fn create_gig(
        env: Env,
        client: Address,
        title: String,
        skill: Symbol,
        milestone_descriptions: Vec<String>,
        milestone_amounts: Vec<i128>,
    ) -> Result<u64, GigVaultError> {
        client.require_auth();
        Self::require_init(&env)?;

        if milestone_amounts.is_empty() || milestone_amounts.len() != milestone_descriptions.len() {
            return Err(GigVaultError::EmptyMilestones);
        }
        for amt in milestone_amounts.iter() {
            if amt <= 0 {
                return Err(GigVaultError::InvalidAmount);
            }
        }

        let mut milestones: Vec<Milestone> = Vec::new(&env);
        for i in 0..milestone_amounts.len() {
            milestones.push_back(Milestone {
                description: milestone_descriptions.get(i).unwrap(),
                amount: milestone_amounts.get(i).unwrap(),
                status: MilestoneStatus::Pending,
            });
        }

        let id: u64 = env
            .storage()
            .instance()
            .get(&DataKey::GigCount)
            .unwrap_or(0u64);

        let gig = Gig {
            id,
            client: client.clone(),
            freelancer: None,
            title,
            skill: skill.clone(),
            status: GigStatus::Open,
            milestones,
            created_at: env.ledger().timestamp(),
        };

        env.storage().persistent().set(&DataKey::Gig(id), &gig);
        env.storage()
            .persistent()
            .extend_ttl(&DataKey::Gig(id), LEDGER_THRESHOLD, LEDGER_BUMP);
        env.storage().instance().set(&DataKey::GigCount, &(id + 1));

        env.events().publish((symbol_short!("gig_new"), client), id);
        Ok(id)
    }

    /// Freelancer accepts an open gig, becoming the assigned worker.
    pub fn accept_gig(env: Env, freelancer: Address, gig_id: u64) -> Result<(), GigVaultError> {
        freelancer.require_auth();
        let mut gig = Self::get_gig_internal(&env, gig_id)?;

        if gig.status != GigStatus::Open {
            return Err(GigVaultError::GigNotOpen);
        }
        if gig.freelancer.is_some() {
            return Err(GigVaultError::AlreadyAccepted);
        }

        gig.freelancer = Some(freelancer.clone());
        gig.status = GigStatus::InProgress;
        Self::save_gig(&env, &gig);

        env.events()
            .publish((symbol_short!("accepted"), freelancer), gig_id);
        Ok(())
    }

    /// Freelancer walks away from a gig they accepted. Any escrowed
    /// (funded/submitted) milestone funds are refunded to the client, the
    /// assignment is cleared, and the gig reopens for other freelancers.
    /// Blocked while a milestone is under dispute — the arbitrator must
    /// resolve it first.
    pub fn reject_gig(env: Env, freelancer: Address, gig_id: u64) -> Result<(), GigVaultError> {
        freelancer.require_auth();
        let mut gig = Self::get_gig_internal(&env, gig_id)?;

        match &gig.freelancer {
            Some(f) if f == &freelancer => {}
            _ => return Err(GigVaultError::NotFreelancer),
        }
        if gig.status != GigStatus::InProgress {
            return Err(GigVaultError::GigNotInProgress);
        }

        let token_addr: Address = env.storage().instance().get(&DataKey::Token).unwrap();
        let token_client = token::Client::new(&env, &token_addr);

        let mut milestones: Vec<Milestone> = Vec::new(&env);
        for mut m in gig.milestones.iter() {
            match m.status {
                MilestoneStatus::Disputed => return Err(GigVaultError::InvalidMilestoneStatus),
                MilestoneStatus::Funded | MilestoneStatus::Submitted => {
                    // Return escrowed funds to the client and reset the
                    // milestone so the next freelancer starts clean.
                    token_client.transfer(&env.current_contract_address(), &gig.client, &m.amount);
                    m.status = MilestoneStatus::Pending;
                }
                _ => {}
            }
            milestones.push_back(m);
        }

        gig.milestones = milestones;
        gig.freelancer = None;
        gig.status = GigStatus::Open;
        Self::save_gig(&env, &gig);

        env.events()
            .publish((symbol_short!("rejected"), freelancer), gig_id);
        Ok(())
    }

    /// Client cancels (deletes) their own gig. Only allowed while the gig is
    /// still Open — once a freelancer has accepted (and funds may be in
    /// escrow), the milestone/dispute flow must be used instead.
    pub fn cancel_gig(env: Env, client: Address, gig_id: u64) -> Result<(), GigVaultError> {
        client.require_auth();
        let mut gig = Self::get_gig_internal(&env, gig_id)?;

        if gig.client != client {
            return Err(GigVaultError::NotClient);
        }
        if gig.status != GigStatus::Open {
            return Err(GigVaultError::GigNotOpen);
        }

        gig.status = GigStatus::Cancelled;
        Self::save_gig(&env, &gig);

        env.events()
            .publish((symbol_short!("cancelled"), client), gig_id);
        Ok(())
    }

    /// Client escrows funds for one milestone by transferring tokens into
    /// the contract's balance.
    pub fn fund_milestone(
        env: Env,
        client: Address,
        gig_id: u64,
        milestone_index: u32,
    ) -> Result<(), GigVaultError> {
        client.require_auth();
        let mut gig = Self::get_gig_internal(&env, gig_id)?;

        if gig.client != client {
            return Err(GigVaultError::NotClient);
        }
        if gig.status != GigStatus::InProgress {
            return Err(GigVaultError::GigNotInProgress);
        }

        let mut milestone = gig
            .milestones
            .get(milestone_index)
            .ok_or(GigVaultError::MilestoneNotFound)?;
        if milestone.status != MilestoneStatus::Pending {
            return Err(GigVaultError::InvalidMilestoneStatus);
        }

        let token_addr: Address = env.storage().instance().get(&DataKey::Token).unwrap();
        let token_client = token::Client::new(&env, &token_addr);
        token_client.transfer(&client, &env.current_contract_address(), &milestone.amount);

        milestone.status = MilestoneStatus::Funded;
        gig.milestones.set(milestone_index, milestone.clone());
        Self::save_gig(&env, &gig);

        env.events().publish(
            (symbol_short!("funded"), client),
            (gig_id, milestone_index, milestone.amount),
        );
        Ok(())
    }

    /// Freelancer marks a funded milestone as delivered / ready for review.
    pub fn submit_milestone(
        env: Env,
        freelancer: Address,
        gig_id: u64,
        milestone_index: u32,
    ) -> Result<(), GigVaultError> {
        freelancer.require_auth();
        let mut gig = Self::get_gig_internal(&env, gig_id)?;

        match &gig.freelancer {
            Some(f) if f == &freelancer => {}
            _ => return Err(GigVaultError::NotFreelancer),
        }

        let mut milestone = gig
            .milestones
            .get(milestone_index)
            .ok_or(GigVaultError::MilestoneNotFound)?;
        if milestone.status != MilestoneStatus::Funded {
            return Err(GigVaultError::InvalidMilestoneStatus);
        }

        milestone.status = MilestoneStatus::Submitted;
        gig.milestones.set(milestone_index, milestone);
        Self::save_gig(&env, &gig);

        env.events().publish(
            (symbol_short!("submitted"), freelancer),
            (gig_id, milestone_index),
        );
        Ok(())
    }

    /// Freelancer re-submits a disputed milestone after reworking the
    /// delivery, moving it back to Submitted so the client can approve it.
    /// This lets both sides settle amicably without waiting for the
    /// arbitrator (who can still resolve it if it gets disputed again).
    pub fn resubmit_milestone(
        env: Env,
        freelancer: Address,
        gig_id: u64,
        milestone_index: u32,
    ) -> Result<(), GigVaultError> {
        freelancer.require_auth();
        let mut gig = Self::get_gig_internal(&env, gig_id)?;

        match &gig.freelancer {
            Some(f) if f == &freelancer => {}
            _ => return Err(GigVaultError::NotFreelancer),
        }

        let mut milestone = gig
            .milestones
            .get(milestone_index)
            .ok_or(GigVaultError::MilestoneNotFound)?;
        if milestone.status != MilestoneStatus::Disputed {
            return Err(GigVaultError::InvalidMilestoneStatus);
        }

        milestone.status = MilestoneStatus::Submitted;
        gig.milestones.set(milestone_index, milestone);
        Self::save_gig(&env, &gig);

        env.events().publish(
            (symbol_short!("resubmit"), freelancer),
            (gig_id, milestone_index),
        );
        Ok(())
    }

    /// Client approves a submitted milestone: escrow releases to the
    /// freelancer and their reputation score improves.
    pub fn approve_milestone(
        env: Env,
        client: Address,
        gig_id: u64,
        milestone_index: u32,
    ) -> Result<(), GigVaultError> {
        client.require_auth();
        let mut gig = Self::get_gig_internal(&env, gig_id)?;

        if gig.client != client {
            return Err(GigVaultError::NotClient);
        }

        let mut milestone = gig
            .milestones
            .get(milestone_index)
            .ok_or(GigVaultError::MilestoneNotFound)?;
        if milestone.status != MilestoneStatus::Submitted {
            return Err(GigVaultError::InvalidMilestoneStatus);
        }

        let freelancer = gig.freelancer.clone().ok_or(GigVaultError::NotFreelancer)?;
        let token_addr: Address = env.storage().instance().get(&DataKey::Token).unwrap();
        let token_client = token::Client::new(&env, &token_addr);
        token_client.transfer(
            &env.current_contract_address(),
            &freelancer,
            &milestone.amount,
        );

        milestone.status = MilestoneStatus::Released;
        gig.milestones.set(milestone_index, milestone.clone());

        let all_released = gig.milestones.iter().all(|m| {
            m.status == MilestoneStatus::Released || m.status == MilestoneStatus::Refunded
        });
        if all_released {
            gig.status = GigStatus::Completed;
        }
        Self::save_gig(&env, &gig);

        Self::bump_reputation(&env, &freelancer, &gig.skill, true, false, milestone.amount);

        env.events().publish(
            (symbol_short!("approved"), client),
            (gig_id, milestone_index, milestone.amount),
        );
        Ok(())
    }

    /// Either party raises a dispute on a submitted/funded milestone,
    /// freezing it until the arbitrator resolves it.
    pub fn raise_dispute(
        env: Env,
        caller: Address,
        gig_id: u64,
        milestone_index: u32,
    ) -> Result<(), GigVaultError> {
        caller.require_auth();
        let mut gig = Self::get_gig_internal(&env, gig_id)?;

        let is_client = gig.client == caller;
        let is_freelancer = gig.freelancer.as_ref() == Some(&caller);
        if !is_client && !is_freelancer {
            return Err(GigVaultError::Unauthorized);
        }

        let mut milestone = gig
            .milestones
            .get(milestone_index)
            .ok_or(GigVaultError::MilestoneNotFound)?;
        if milestone.status != MilestoneStatus::Funded
            && milestone.status != MilestoneStatus::Submitted
        {
            return Err(GigVaultError::InvalidMilestoneStatus);
        }

        milestone.status = MilestoneStatus::Disputed;
        gig.milestones.set(milestone_index, milestone);
        Self::save_gig(&env, &gig);

        env.events().publish(
            (symbol_short!("disputed"), caller),
            (gig_id, milestone_index),
        );
        Ok(())
    }

    /// Arbitrator resolves a disputed milestone, sending escrowed funds to
    /// either the freelancer or back to the client, and adjusts reputation.
    pub fn resolve_dispute(
        env: Env,
        arbitrator: Address,
        gig_id: u64,
        milestone_index: u32,
        favor_freelancer: bool,
    ) -> Result<(), GigVaultError> {
        arbitrator.require_auth();
        let stored_arbitrator: Address =
            env.storage().instance().get(&DataKey::Arbitrator).unwrap();
        if arbitrator != stored_arbitrator {
            return Err(GigVaultError::NotArbitrator);
        }

        let mut gig = Self::get_gig_internal(&env, gig_id)?;
        let mut milestone = gig
            .milestones
            .get(milestone_index)
            .ok_or(GigVaultError::MilestoneNotFound)?;
        if milestone.status != MilestoneStatus::Disputed {
            return Err(GigVaultError::InvalidMilestoneStatus);
        }

        let token_addr: Address = env.storage().instance().get(&DataKey::Token).unwrap();
        let token_client = token::Client::new(&env, &token_addr);
        let freelancer = gig.freelancer.clone().ok_or(GigVaultError::NotFreelancer)?;

        if favor_freelancer {
            token_client.transfer(
                &env.current_contract_address(),
                &freelancer,
                &milestone.amount,
            );
            milestone.status = MilestoneStatus::Released;
        } else {
            token_client.transfer(
                &env.current_contract_address(),
                &gig.client,
                &milestone.amount,
            );
            milestone.status = MilestoneStatus::Refunded;
        }
        gig.milestones.set(milestone_index, milestone.clone());
        Self::save_gig(&env, &gig);

        Self::bump_reputation(
            &env,
            &freelancer,
            &gig.skill,
            false,
            favor_freelancer,
            milestone.amount,
        );

        env.events().publish(
            (symbol_short!("resolved"), arbitrator),
            (gig_id, milestone_index, favor_freelancer),
        );
        Ok(())
    }

    // ---------------------------------------------------------------- views

    pub fn get_gig(env: Env, gig_id: u64) -> Result<Gig, GigVaultError> {
        Self::get_gig_internal(&env, gig_id)
    }

    pub fn get_gig_count(env: Env) -> u64 {
        env.storage()
            .instance()
            .get(&DataKey::GigCount)
            .unwrap_or(0u64)
    }

    pub fn get_reputation(env: Env, who: Address) -> Reputation {
        env.storage()
            .persistent()
            .get(&DataKey::Reputation(who))
            .unwrap_or(Reputation {
                skill: symbol_short!("none"),
                completed: 0,
                disputed_won: 0,
                disputed_lost: 0,
                total_earned: 0,
                score: 0,
            })
    }

    pub fn get_arbitrator(env: Env) -> Address {
        env.storage().instance().get(&DataKey::Arbitrator).unwrap()
    }

    pub fn get_token(env: Env) -> Address {
        env.storage().instance().get(&DataKey::Token).unwrap()
    }

    // ------------------------------------------------------------- internal

    fn require_init(env: &Env) -> Result<(), GigVaultError> {
        if !env.storage().instance().has(&DataKey::Admin) {
            return Err(GigVaultError::NotInitialized);
        }
        Ok(())
    }

    fn get_gig_internal(env: &Env, gig_id: u64) -> Result<Gig, GigVaultError> {
        env.storage()
            .persistent()
            .get(&DataKey::Gig(gig_id))
            .ok_or(GigVaultError::GigNotFound)
    }

    fn save_gig(env: &Env, gig: &Gig) {
        env.storage().persistent().set(&DataKey::Gig(gig.id), gig);
        env.storage()
            .persistent()
            .extend_ttl(&DataKey::Gig(gig.id), LEDGER_THRESHOLD, LEDGER_BUMP);
    }

    /// Composite score: completed work builds trust, lost disputes erode it.
    /// Score is clamped to [0, 1000] so the frontend can render a simple bar.
    fn bump_reputation(
        env: &Env,
        who: &Address,
        skill: &Symbol,
        completed: bool,
        won_dispute: bool,
        amount: i128,
    ) {
        let key = DataKey::Reputation(who.clone());
        let mut rep: Reputation = env.storage().persistent().get(&key).unwrap_or(Reputation {
            skill: skill.clone(),
            completed: 0,
            disputed_won: 0,
            disputed_lost: 0,
            total_earned: 0,
            score: 0,
        });

        rep.skill = skill.clone();
        if completed {
            rep.completed += 1;
            rep.total_earned += amount;
        } else if won_dispute {
            rep.disputed_won += 1;
            rep.total_earned += amount;
        } else {
            rep.disputed_lost += 1;
        }

        let positive = (rep.completed * 25 + rep.disputed_won * 10) as i32;
        let negative = (rep.disputed_lost * 40) as i32;
        let raw = 500 + positive - negative;
        rep.score = raw.clamp(0, 1000) as u32;

        env.storage().persistent().set(&key, &rep);
        env.storage()
            .persistent()
            .extend_ttl(&key, LEDGER_THRESHOLD, LEDGER_BUMP);
    }
}

mod test;
