import AccessControl "./authorization/access-control";
import MixinAuthorization "./authorization/MixinAuthorization";
import Map "mo:core/Map";
import Iter "mo:core/Iter";
import Nat "mo:core/Nat";
import Time "mo:base/Time";

actor {
  // Authorization state
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  // Types
  public type DonationStatus = { #pending; #accepted; #delivered; #rejected };

  public type Donation = {
    id : Nat;
    donorName : Text;
    medicineName : Text;
    quantity : Nat;
    expiryDate : Text;
    status : DonationStatus;
    notes : Text;
    createdAt : Int;
  };

  public type DonationStats = {
    total : Nat;
    pending : Nat;
    accepted : Nat;
    delivered : Nat;
    rejected : Nat;
  };

  // State
  var nextId : Nat = 1;
  let donations = Map.empty<Nat, Donation>();

  // Create
  public shared ({ caller = _ }) func createDonation(
    donorName : Text,
    medicineName : Text,
    quantity : Nat,
    expiryDate : Text,
    notes : Text,
  ) : async Nat {
    let id = nextId;
    nextId += 1;
    let donation : Donation = {
      id;
      donorName;
      medicineName;
      quantity;
      expiryDate;
      status = #pending;
      notes;
      createdAt = Time.now();
    };
    donations.add(id, donation);
    id
  };

  // Read all
  public query func getDonations() : async [Donation] {
    donations.values().toArray()
  };

  // Read one
  public query func getDonation(id : Nat) : async ?Donation {
    donations.get(id)
  };

  // Update fields
  public shared ({ caller = _ }) func updateDonation(
    id : Nat,
    donorName : Text,
    medicineName : Text,
    quantity : Nat,
    expiryDate : Text,
    notes : Text,
  ) : async Bool {
    switch (donations.get(id)) {
      case (null) { false };
      case (?existing) {
        let updated : Donation = {
          id = existing.id;
          donorName;
          medicineName;
          quantity;
          expiryDate;
          status = existing.status;
          notes;
          createdAt = existing.createdAt;
        };
        donations.add(id, updated);
        true
      };
    }
  };

  // Update status (admin only)
  public shared ({ caller }) func updateStatus(id : Nat, status : DonationStatus) : async Bool {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      return false;
    };
    switch (donations.get(id)) {
      case (null) { false };
      case (?existing) {
        let updated : Donation = {
          id = existing.id;
          donorName = existing.donorName;
          medicineName = existing.medicineName;
          quantity = existing.quantity;
          expiryDate = existing.expiryDate;
          status;
          notes = existing.notes;
          createdAt = existing.createdAt;
        };
        donations.add(id, updated);
        true
      };
    }
  };

  // Delete (admin only)
  public shared ({ caller }) func deleteDonation(id : Nat) : async Bool {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      return false;
    };
    switch (donations.get(id)) {
      case (null) { false };
      case (?_) {
        donations.remove(id);
        true
      };
    }
  };

  // Stats
  public query func getStats() : async DonationStats {
    var total = 0;
    var pending = 0;
    var accepted = 0;
    var delivered = 0;
    var rejected = 0;
    for (d in donations.values()) {
      total += 1;
      switch (d.status) {
        case (#pending) { pending += 1 };
        case (#accepted) { accepted += 1 };
        case (#delivered) { delivered += 1 };
        case (#rejected) { rejected += 1 };
      };
    };
    { total; pending; accepted; delivered; rejected }
  };
}
