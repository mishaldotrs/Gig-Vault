#![cfg(test)]

use super::*;
use soroban_sdk::{
    symbol_short, testutils::Address as _, token::StellarAssetClient, Env, String as SorobanString,
    Vec,
};

fn setup(env: &Env) -> (Address, Address, Address, Address, GigVaultContractClient) {
    let admin = Address::generate(env);
    let arbitrator = Address::generate(env);
    let issuer = Address::generate(env);

    let sac = env.register_stellar_asset_contract_v2(issuer.clone());
    let token_address = sac.address();

    let contract_id = env.register(GigVaultContract, ());
    let client = GigVaultContractClient::new(env, &contract_id);

    (admin, arbitrator, token_address, issuer, client)
}

#[test]
fn full_happy_path_releases_escrow_and_builds_reputation() {
    let env = Env::default();
    env.mock_all_auths();

    let (admin, arbitrator, token_address, issuer, client) = setup(&env);
    client.initialize(&admin, &arbitrator, &token_address);

    let sac_client = StellarAssetClient::new(&env, &token_address);
    let customer = Address::generate(&env);
    let freelancer = Address::generate(&env);
    sac_client.mint(&customer, &10_000);

    let mut descs: Vec<SorobanString> = Vec::new(&env);
    descs.push_back(SorobanString::from_str(&env, "Wireframes"));
    descs.push_back(SorobanString::from_str(&env, "Final build"));
    let mut amounts: Vec<i128> = Vec::new(&env);
    amounts.push_back(500);
    amounts.push_back(1500);

    let gig_id = client.create_gig(
        &customer,
        &SorobanString::from_str(&env, "Landing page redesign"),
        &symbol_short!("design"),
        &descs,
        &amounts,
    );

    client.accept_gig(&freelancer, &gig_id);
    client.fund_milestone(&customer, &gig_id, &0);
    client.submit_milestone(&freelancer, &gig_id, &0);
    client.approve_milestone(&customer, &gig_id, &0);

    let gig = client.get_gig(&gig_id);
    assert_eq!(
        gig.milestones.get(0).unwrap().status,
        MilestoneStatus::Released
    );
    assert_eq!(gig.status, GigStatus::InProgress);

    let rep = client.get_reputation(&freelancer);
    assert_eq!(rep.completed, 1);
    assert_eq!(rep.total_earned, 500);
    assert!(rep.score > 500);

    let _ = issuer; // issuer kept alive for SAC setup
}

#[test]
fn dispute_favoring_client_refunds_escrow() {
    let env = Env::default();
    env.mock_all_auths();

    let (admin, arbitrator, token_address, _issuer, client) = setup(&env);
    client.initialize(&admin, &arbitrator, &token_address);

    let sac_client = StellarAssetClient::new(&env, &token_address);
    let customer = Address::generate(&env);
    let freelancer = Address::generate(&env);
    sac_client.mint(&customer, &10_000);

    let mut descs: Vec<SorobanString> = Vec::new(&env);
    descs.push_back(SorobanString::from_str(&env, "Smart contract audit"));
    let mut amounts: Vec<i128> = Vec::new(&env);
    amounts.push_back(2000);

    let gig_id = client.create_gig(
        &customer,
        &SorobanString::from_str(&env, "Audit engagement"),
        &symbol_short!("security"),
        &descs,
        &amounts,
    );

    client.accept_gig(&freelancer, &gig_id);
    client.fund_milestone(&customer, &gig_id, &0);
    client.submit_milestone(&freelancer, &gig_id, &0);
    client.raise_dispute(&customer, &gig_id, &0);
    client.resolve_dispute(&arbitrator, &gig_id, &0, &false);

    let gig = client.get_gig(&gig_id);
    assert_eq!(
        gig.milestones.get(0).unwrap().status,
        MilestoneStatus::Refunded
    );

    let rep = client.get_reputation(&freelancer);
    assert_eq!(rep.disputed_lost, 1);
    assert!(rep.score < 500);
}

#[test]
fn client_can_cancel_open_gig_but_not_after_accept() {
    let env = Env::default();
    env.mock_all_auths();

    let (admin, arbitrator, token_address, _issuer, client) = setup(&env);
    client.initialize(&admin, &arbitrator, &token_address);

    let customer = Address::generate(&env);
    let stranger = Address::generate(&env);
    let freelancer = Address::generate(&env);

    let mut descs: Vec<SorobanString> = Vec::new(&env);
    descs.push_back(SorobanString::from_str(&env, "Logo sketch"));
    let mut amounts: Vec<i128> = Vec::new(&env);
    amounts.push_back(300);

    // Gig #1: cancelled while still open.
    let gig_a = client.create_gig(
        &customer,
        &SorobanString::from_str(&env, "Logo design"),
        &symbol_short!("design"),
        &descs,
        &amounts,
    );

    // Only the creator can cancel.
    assert!(client.try_cancel_gig(&stranger, &gig_a).is_err());

    client.cancel_gig(&customer, &gig_a);
    assert_eq!(client.get_gig(&gig_a).status, GigStatus::Cancelled);

    // A cancelled gig can no longer be accepted.
    assert!(client.try_accept_gig(&freelancer, &gig_a).is_err());

    // Gig #2: once accepted, cancellation is blocked.
    let gig_b = client.create_gig(
        &customer,
        &SorobanString::from_str(&env, "Logo design v2"),
        &symbol_short!("design"),
        &descs,
        &amounts,
    );
    client.accept_gig(&freelancer, &gig_b);
    assert!(client.try_cancel_gig(&customer, &gig_b).is_err());
}

#[test]
fn freelancer_reject_refunds_escrow_and_reopens_gig() {
    let env = Env::default();
    env.mock_all_auths();

    let (admin, arbitrator, token_address, _issuer, client) = setup(&env);
    client.initialize(&admin, &arbitrator, &token_address);

    let sac_client = StellarAssetClient::new(&env, &token_address);
    let token_client = soroban_sdk::token::Client::new(&env, &token_address);
    let customer = Address::generate(&env);
    let freelancer_a = Address::generate(&env);
    let freelancer_b = Address::generate(&env);
    sac_client.mint(&customer, &10_000);

    let mut descs: Vec<SorobanString> = Vec::new(&env);
    descs.push_back(SorobanString::from_str(&env, "Homepage"));
    let mut amounts: Vec<i128> = Vec::new(&env);
    amounts.push_back(4_000);

    let gig_id = client.create_gig(
        &customer,
        &SorobanString::from_str(&env, "Website build"),
        &symbol_short!("frontend"),
        &descs,
        &amounts,
    );

    // Only the assigned freelancer can reject.
    client.accept_gig(&freelancer_a, &gig_id);
    assert!(client.try_reject_gig(&freelancer_b, &gig_id).is_err());

    // Client escrows milestone 1, then the freelancer walks away.
    client.fund_milestone(&customer, &gig_id, &0);
    assert_eq!(token_client.balance(&customer), 6_000);

    client.reject_gig(&freelancer_a, &gig_id);

    // Escrow refunded, milestone reset, gig reopened with no freelancer.
    assert_eq!(token_client.balance(&customer), 10_000);
    let gig = client.get_gig(&gig_id);
    assert_eq!(gig.status, GigStatus::Open);
    assert!(gig.freelancer.is_none());
    assert_eq!(
        gig.milestones.get(0).unwrap().status,
        MilestoneStatus::Pending
    );

    // Another freelancer can now pick it up.
    client.accept_gig(&freelancer_b, &gig_id);
    assert_eq!(client.get_gig(&gig_id).status, GigStatus::InProgress);
}

#[test]
fn freelancer_can_resubmit_disputed_milestone() {
    let env = Env::default();
    env.mock_all_auths();

    let (admin, arbitrator, token_address, _issuer, client) = setup(&env);
    client.initialize(&admin, &arbitrator, &token_address);

    let sac_client = StellarAssetClient::new(&env, &token_address);
    let token_client = soroban_sdk::token::Client::new(&env, &token_address);
    let customer = Address::generate(&env);
    let freelancer = Address::generate(&env);
    let stranger = Address::generate(&env);
    sac_client.mint(&customer, &10_000);

    let mut descs: Vec<SorobanString> = Vec::new(&env);
    descs.push_back(SorobanString::from_str(&env, "Illustration"));
    let mut amounts: Vec<i128> = Vec::new(&env);
    amounts.push_back(1_000);

    let gig_id = client.create_gig(
        &customer,
        &SorobanString::from_str(&env, "Book cover"),
        &symbol_short!("design"),
        &descs,
        &amounts,
    );

    client.accept_gig(&freelancer, &gig_id);
    client.fund_milestone(&customer, &gig_id, &0);
    client.submit_milestone(&freelancer, &gig_id, &0);

    // Client isn't happy and raises a dispute.
    client.raise_dispute(&customer, &gig_id, &0);
    assert_eq!(
        client.get_gig(&gig_id).milestones.get(0).unwrap().status,
        MilestoneStatus::Disputed
    );

    // Only the assigned freelancer can resubmit; resubmitting a
    // non-disputed milestone is also rejected.
    assert!(client
        .try_resubmit_milestone(&stranger, &gig_id, &0)
        .is_err());

    // Freelancer reworks the delivery and resubmits.
    client.resubmit_milestone(&freelancer, &gig_id, &0);
    assert_eq!(
        client.get_gig(&gig_id).milestones.get(0).unwrap().status,
        MilestoneStatus::Submitted
    );
    assert!(client
        .try_resubmit_milestone(&freelancer, &gig_id, &0)
        .is_err());

    // This time the client approves — escrow releases as usual.
    client.approve_milestone(&customer, &gig_id, &0);
    assert_eq!(token_client.balance(&freelancer), 1_000);
    assert_eq!(
        client.get_gig(&gig_id).milestones.get(0).unwrap().status,
        MilestoneStatus::Released
    );
}

#[test]
fn cannot_accept_gig_twice() {
    let env = Env::default();
    env.mock_all_auths();

    let (admin, arbitrator, token_address, _issuer, client) = setup(&env);
    client.initialize(&admin, &arbitrator, &token_address);

    let customer = Address::generate(&env);
    let freelancer_a = Address::generate(&env);
    let freelancer_b = Address::generate(&env);

    let mut descs: Vec<SorobanString> = Vec::new(&env);
    descs.push_back(SorobanString::from_str(&env, "Copy edit"));
    let mut amounts: Vec<i128> = Vec::new(&env);
    amounts.push_back(100);

    let gig_id = client.create_gig(
        &customer,
        &SorobanString::from_str(&env, "Blog edit"),
        &symbol_short!("writing"),
        &descs,
        &amounts,
    );

    client.accept_gig(&freelancer_a, &gig_id);
    let result = client.try_accept_gig(&freelancer_b, &gig_id);
    assert!(result.is_err());
}
