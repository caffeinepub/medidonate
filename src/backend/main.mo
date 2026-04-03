import AccessControl "./authorization/access-control";
import MixinAuthorization "./authorization/MixinAuthorization";
import Map "mo:core/Map";
import Nat "mo:core/Nat";
import Array "mo:base/Array";
import Time "mo:base/Time";
import Principal "mo:base/Principal";
import Text "mo:base/Text";

actor {
  // Authorization state
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  // Types
  public type DonationStatus = { #pending; #accepted; #delivered; #rejected };

  public type CustodyEvent = {
    timestamp : Int;
    changedBy : Principal;
    oldStatus : DonationStatus;
    newStatus : DonationStatus;
  };

  type DonationV1 = {
    id : Nat;
    donorName : Text;
    medicineName : Text;
    quantity : Nat;
    expiryDate : Text;
    status : DonationStatus;
    notes : Text;
    createdAt : Int;
  };

  type DonationV2 = {
    id : Nat;
    donorName : Text;
    medicineName : Text;
    quantity : Nat;
    expiryDate : Text;
    status : DonationStatus;
    notes : Text;
    createdAt : Int;
    pickupAddress : Text;
    pickupLat : Float;
    pickupLng : Float;
  };

  type DonationV3 = {
    id : Nat;
    donorName : Text;
    medicineName : Text;
    quantity : Nat;
    expiryDate : Text;
    status : DonationStatus;
    notes : Text;
    createdAt : Int;
    pickupAddress : Text;
    pickupLat : Float;
    pickupLng : Float;
    creatorPrincipal : Principal;
  };

  public type Donation = {
    id : Nat;
    donorName : Text;
    medicineName : Text;
    quantity : Nat;
    expiryDate : Text;
    status : DonationStatus;
    notes : Text;
    createdAt : Int;
    pickupAddress : Text;
    pickupLat : Float;
    pickupLng : Float;
    creatorPrincipal : Principal;
    batchNumber : Text;
    custodyLog : [CustodyEvent];
  };

  public type DonationStats = {
    total : Nat;
    pending : Nat;
    accepted : Nat;
    delivered : Nat;
    rejected : Nat;
    totalDeliveredQuantity : Nat;
  };

  public type UserProfile = {
    displayName : Text;
    phone : Text;
    bio : Text;
    updatedAt : Int;
  };

  public type LeaderboardEntry = {
    donorName : Text;
    deliveredQuantity : Nat;
  };

  // Input sanitization helpers
  func trimChar(c : Char) : Bool {
    c == ' ' or c == '\n' or c == '\t' or c == '\r'
  };

  func trimText(t : Text) : Text {
    let chars = Text.toArray(t);
    var start = 0;
    var end_ = chars.size();
    while (start < end_ and trimChar(chars[start])) { start += 1 };
    while (end_ > start and trimChar(chars[end_ - 1 : Nat])) { end_ -= 1 };
    let len : Nat = if (end_ > start) { end_ - start } else { 0 };
    Text.fromArray(Array.subArray(chars, start, len))
  };

  func clamp(t : Text, maxLen : Nat) : Text {
    let arr = Text.toArray(t);
    if (arr.size() <= maxLen) { t }
    else { Text.fromArray(Array.subArray(arr, 0, maxLen)) }
  };

  func sanitizeName(t : Text) : Text { clamp(trimText(t), 100) };
  func sanitizeNotes(t : Text) : Text { clamp(trimText(t), 500) };
  func sanitizeAddress(t : Text) : Text { clamp(trimText(t), 200) };
  func sanitizePhone(t : Text) : Text { clamp(trimText(t), 20) };
  func sanitizeBio(t : Text) : Text { clamp(trimText(t), 300) };
  func sanitizeBatch(t : Text) : Text { clamp(trimText(t), 50) };

  // Convert Nat to Float without deprecated Float.fromInt
  func natToFloat(n : Nat) : Float {
    var f : Float = 0.0;
    var k = n;
    while (k > 0) {
      f += 1.0;
      k -= 1;
    };
    f
  };

  // State
  var nextId : Nat = 1;

  let donations = Map.empty<Nat, DonationV1>();
  let donationsV2 = Map.empty<Nat, DonationV2>();
  let donationsV3 = Map.empty<Nat, DonationV3>();
  let donationsV4 = Map.empty<Nat, Donation>();
  let userProfiles = Map.empty<Principal, UserProfile>();

  system func postupgrade() {
    let anon = Principal.fromText("2vxsx-fae");
    for ((k, v) in donations.entries()) {
      let m : Donation = {
        id = v.id; donorName = v.donorName; medicineName = v.medicineName;
        quantity = v.quantity; expiryDate = v.expiryDate; status = v.status;
        notes = v.notes; createdAt = v.createdAt;
        pickupAddress = ""; pickupLat = 0.0; pickupLng = 0.0;
        creatorPrincipal = anon; batchNumber = ""; custodyLog = [];
      };
      donationsV4.add(k, m);
      donations.remove(k);
    };
    for ((k, v) in donationsV2.entries()) {
      let m : Donation = {
        id = v.id; donorName = v.donorName; medicineName = v.medicineName;
        quantity = v.quantity; expiryDate = v.expiryDate; status = v.status;
        notes = v.notes; createdAt = v.createdAt;
        pickupAddress = v.pickupAddress; pickupLat = v.pickupLat; pickupLng = v.pickupLng;
        creatorPrincipal = anon; batchNumber = ""; custodyLog = [];
      };
      donationsV4.add(k, m);
      donationsV2.remove(k);
    };
    for ((k, v) in donationsV3.entries()) {
      let m : Donation = {
        id = v.id; donorName = v.donorName; medicineName = v.medicineName;
        quantity = v.quantity; expiryDate = v.expiryDate; status = v.status;
        notes = v.notes; createdAt = v.createdAt;
        pickupAddress = v.pickupAddress; pickupLat = v.pickupLat; pickupLng = v.pickupLng;
        creatorPrincipal = v.creatorPrincipal; batchNumber = ""; custodyLog = [];
      };
      donationsV4.add(k, m);
      donationsV3.remove(k);
    };
  };

  public shared ({ caller }) func createDonation(
    donorName : Text, medicineName : Text, quantity : Nat,
    expiryDate : Text, batchNumber : Text, notes : Text,
    pickupAddress : Text, pickupLat : Float, pickupLng : Float,
  ) : async Nat {
    let id = nextId;
    nextId += 1;
    donationsV4.add(id, {
      id;
      donorName = sanitizeName(donorName);
      medicineName = sanitizeName(medicineName);
      quantity;
      expiryDate = trimText(expiryDate);
      batchNumber = sanitizeBatch(batchNumber);
      status = #pending;
      notes = sanitizeNotes(notes);
      createdAt = Time.now();
      pickupAddress = sanitizeAddress(pickupAddress);
      pickupLat; pickupLng;
      creatorPrincipal = caller;
      custodyLog = [];
    });
    id
  };

  // Seed 100 sample donations (callable by any authenticated user)
  public shared ({ caller }) func seedDonations() : async Nat {
    let medicines = [
      "Paracetamol", "Amoxicillin", "Ibuprofen", "Metformin", "Atorvastatin",
      "Omeprazole", "Lisinopril", "Amlodipine", "Ciprofloxacin", "Azithromycin",
      "Salbutamol", "Prednisolone", "Metronidazole", "Diclofenac", "Cetirizine",
      "Folic Acid", "Vitamin C", "Zinc Sulfate", "Oral Rehydration Salts", "Aspirin"
    ];
    let donors = [
      "City Hospital", "Red Cross", "MedAid Foundation", "Health First NGO",
      "Community Clinic", "Dr. Sarah Khan", "Global Health Fund",
      "Sunrise Pharmacy", "Hope Medical", "Care Alliance"
    ];
    let addresses = [
      "123 Main St, New York", "456 Oak Ave, Los Angeles", "789 Pine Rd, Chicago",
      "321 Elm St, Houston", "654 Maple Dr, Phoenix", "987 Cedar Ln, Philadelphia",
      "147 Birch Blvd, San Antonio", "258 Spruce Way, San Diego", "369 Willow Ct, Dallas",
      ""
    ];
    let statuses : [DonationStatus] = [#pending, #pending, #pending, #accepted, #accepted, #delivered, #rejected];
    let expiries = [
      "2027-06-30", "2027-12-31", "2026-09-15", "2026-03-01", "2027-03-20",
      "2025-11-30", "2026-07-04", "2027-01-15", "2026-04-30", "2028-02-28"
    ];
    let batches = [
      "BT-001", "BT-002", "BT-003", "BT-004", "BT-005",
      "BT-006", "BT-007", "BT-008", "BT-009", "BT-010"
    ];

    var count = 0;
    var i = 0;
    while (i < 100) {
      let medIdx = i % medicines.size();
      let donorIdx = i % donors.size();
      let addrIdx = i % addresses.size();
      let statusIdx = i % statuses.size();
      let expiryIdx = i % expiries.size();
      let batchIdx = i % batches.size();
      let qty : Nat = 10 + (i * 7 % 491);
      let lat : Float = 34.0 + natToFloat(i % 20) * 0.5;
      let lng : Float = -118.0 - natToFloat(i % 15) * 0.3;

      let id = nextId;
      nextId += 1;
      donationsV4.add(id, {
        id;
        donorName = donors[donorIdx];
        medicineName = medicines[medIdx];
        quantity = qty;
        expiryDate = expiries[expiryIdx];
        batchNumber = batches[batchIdx];
        status = statuses[statusIdx];
        notes = "Sample donation #" # (i + 1).toText();
        createdAt = Time.now();
        pickupAddress = addresses[addrIdx];
        pickupLat = lat;
        pickupLng = lng;
        creatorPrincipal = caller;
        custodyLog = [];
      });
      count += 1;
      i += 1;
    };
    count
  };


  // Seed 20 sample "person in need" donation requests
  public shared ({ caller }) func seedNeedRequests() : async Nat {
    let patientNames = [
      "Ahmed Al-Rashid", "Maria Santos", "Chen Wei", "Fatima Ndiaye",
      "Carlos Mendoza", "Priya Sharma", "James Okonkwo", "Sofia Petrov",
      "Mohammed Al-Farsi", "Ana Lima", "Kwame Asante", "Yuki Tanaka",
      "Rosa Hernandez", "David Kimani", "Amara Diallo", "Lin Feng",
      "Elena Popescu", "Samuel Osei", "Leila Ahmadi", "Ivan Petrov"
    ];
    let medicines = [
      "Insulin", "Metformin", "Salbutamol Inhaler", "Amlodipine",
      "Paracetamol", "Amoxicillin", "Prednisolone", "Omeprazole",
      "Atorvastatin", "Lisinopril", "Ciprofloxacin", "Folic Acid",
      "Oral Rehydration Salts", "Zinc Sulfate", "Vitamin D",
      "Azithromycin", "Ibuprofen", "Cetirizine", "Metronidazole", "Aspirin"
    ];
    let conditions = [
      "Diabetic patient requiring insulin for daily management",
      "Child with severe asthma needing urgent inhaler supply",
      "Elderly with hypertension, cannot afford monthly medication",
      "Post-surgery recovery requires antibiotics course",
      "Pregnant mother needs folic acid supplements",
      "Chronic kidney patient on strict medication regime",
      "Malaria treatment needed for family of three",
      "Refugee camp resident with recurring infections",
      "Cardiac patient unable to access medication since relocation",
      "Child with severe malnutrition needs zinc and ORS",
      "Single mother with two children needing fever medication",
      "Elderly stroke survivor requiring blood pressure medication",
      "Rural patient with no pharmacy access needs antibiotics",
      "Patient with allergic rhinitis, seasonal flare-up",
      "Diabetic ulcer patient requiring wound care medication",
      "Displaced family with sick infant needs ORS and vitamins",
      "Patient recovering from pneumonia needs continued antibiotics",
      "Low-income senior citizen with arthritis pain",
      "Tuberculosis patient in follow-up treatment phase",
      "Community health worker requesting supplies for village clinic"
    ];
    let addresses = [
      "Community Shelter, Block 4", "Refugee Camp Zone B", "Rural Clinic, District 3",
      "Urban Slum Area, South City", "Orphanage Center, Main Road", ""
    ];
    let quantities : [Nat] = [30, 60, 14, 90, 28, 7, 21, 45, 10, 50,
                               15, 30, 20, 60, 14, 90, 7, 30, 60, 21];

    var count = 0;
    var i = 0;
    while (i < 20) {
      let addrIdx = i % addresses.size();
      let lat : Float = 20.0 + natToFloat(i % 10) * 1.5;
      let lng : Float = 10.0 + natToFloat(i % 8) * 2.0;

      let id = nextId;
      nextId += 1;
      donationsV4.add(id, {
        id;
        donorName = patientNames[i];
        medicineName = medicines[i];
        quantity = quantities[i];
        expiryDate = "2099-12-31";
        batchNumber = "";
        status = #pending;
        notes = "[NEED REQUEST] " # conditions[i];
        createdAt = Time.now();
        pickupAddress = addresses[addrIdx];
        pickupLat = lat;
        pickupLng = lng;
        creatorPrincipal = caller;
        custodyLog = [];
      });
      count += 1;
      i += 1;
    };
    count
  };

  public query func getDonations() : async [Donation] {
    donationsV4.values().toArray()
  };

  public query func getDonation(id : Nat) : async ?Donation {
    donationsV4.get(id)
  };

  public query func getUserDonations(user : Principal) : async [Donation] {
    let all = donationsV4.values().toArray();
    Array.filter<Donation>(all, func(d) { Principal.equal(d.creatorPrincipal, user) })
  };

  public query func getCustodyLog(id : Nat) : async [CustodyEvent] {
    switch (donationsV4.get(id)) {
      case (null) { [] };
      case (?d) { d.custodyLog };
    }
  };

  public shared ({ caller }) func updateDonation(
    id : Nat, donorName : Text, medicineName : Text, quantity : Nat,
    expiryDate : Text, batchNumber : Text, notes : Text,
    pickupAddress : Text, pickupLat : Float, pickupLng : Float,
  ) : async Bool {
    switch (donationsV4.get(id)) {
      case (null) { false };
      case (?e) {
        if (not Principal.equal(caller, e.creatorPrincipal) and not AccessControl.isAdmin(accessControlState, caller)) {
          return false;
        };
        donationsV4.add(id, {
          id = e.id;
          donorName = sanitizeName(donorName);
          medicineName = sanitizeName(medicineName);
          quantity;
          expiryDate = trimText(expiryDate);
          batchNumber = sanitizeBatch(batchNumber);
          status = e.status;
          notes = sanitizeNotes(notes);
          createdAt = e.createdAt;
          pickupAddress = sanitizeAddress(pickupAddress);
          pickupLat; pickupLng;
          creatorPrincipal = e.creatorPrincipal;
          custodyLog = e.custodyLog;
        });
        true
      };
    }
  };

  public shared ({ caller }) func setDonationLocation(
    id : Nat, address : Text, lat : Float, lng : Float,
  ) : async Bool {
    switch (donationsV4.get(id)) {
      case (null) { false };
      case (?e) {
        if (not Principal.equal(caller, e.creatorPrincipal) and not AccessControl.isAdmin(accessControlState, caller)) {
          return false;
        };
        donationsV4.add(id, {
          id = e.id; donorName = e.donorName; medicineName = e.medicineName;
          quantity = e.quantity; expiryDate = e.expiryDate; batchNumber = e.batchNumber;
          status = e.status; notes = e.notes; createdAt = e.createdAt;
          pickupAddress = sanitizeAddress(address); pickupLat = lat; pickupLng = lng;
          creatorPrincipal = e.creatorPrincipal; custodyLog = e.custodyLog;
        });
        true
      };
    }
  };

  public shared ({ caller }) func updateStatus(id : Nat, status : DonationStatus) : async Bool {
    if (not AccessControl.isAdmin(accessControlState, caller)) { return false };
    switch (donationsV4.get(id)) {
      case (null) { false };
      case (?e) {
        let event : CustodyEvent = {
          timestamp = Time.now();
          changedBy = caller;
          oldStatus = e.status;
          newStatus = status;
        };
        let newLog = Array.append(e.custodyLog, [event]);
        donationsV4.add(id, {
          id = e.id; donorName = e.donorName; medicineName = e.medicineName;
          quantity = e.quantity; expiryDate = e.expiryDate; batchNumber = e.batchNumber;
          status; notes = e.notes; createdAt = e.createdAt;
          pickupAddress = e.pickupAddress; pickupLat = e.pickupLat; pickupLng = e.pickupLng;
          creatorPrincipal = e.creatorPrincipal; custodyLog = newLog;
        });
        true
      };
    }
  };

  // Batch update status for up to 50 donations at once (admin only)
  public shared ({ caller }) func batchUpdateStatus(ids : [Nat], status : DonationStatus) : async Nat {
    if (not AccessControl.isAdmin(accessControlState, caller)) { return 0 };
    // Cap at 50
    let limit = if (ids.size() > 50) { 50 } else { ids.size() };
    let subset = Array.subArray(ids, 0, limit);
    var count = 0;
    for (id in subset.vals()) {
      switch (donationsV4.get(id)) {
        case (null) {};
        case (?e) {
          let event : CustodyEvent = {
            timestamp = Time.now();
            changedBy = caller;
            oldStatus = e.status;
            newStatus = status;
          };
          let newLog = Array.append(e.custodyLog, [event]);
          donationsV4.add(id, {
            id = e.id; donorName = e.donorName; medicineName = e.medicineName;
            quantity = e.quantity; expiryDate = e.expiryDate; batchNumber = e.batchNumber;
            status; notes = e.notes; createdAt = e.createdAt;
            pickupAddress = e.pickupAddress; pickupLat = e.pickupLat; pickupLng = e.pickupLng;
            creatorPrincipal = e.creatorPrincipal; custodyLog = newLog;
          });
          count += 1;
        };
      };
    };
    count
  };

  public shared ({ caller }) func deleteDonation(id : Nat) : async Bool {
    switch (donationsV4.get(id)) {
      case (null) { false };
      case (?e) {
        if (not Principal.equal(caller, e.creatorPrincipal) and not AccessControl.isAdmin(accessControlState, caller)) {
          return false;
        };
        donationsV4.remove(id);
        true
      };
    }
  };

  public query func getStats() : async DonationStats {
    var total = 0; var pending = 0; var accepted = 0; var delivered = 0; var rejected = 0;
    var totalDeliveredQuantity = 0;
    for (d in donationsV4.values()) {
      total += 1;
      switch (d.status) {
        case (#pending) { pending += 1 };
        case (#accepted) { accepted += 1 };
        case (#delivered) { delivered += 1; totalDeliveredQuantity += d.quantity };
        case (#rejected) { rejected += 1 };
      };
    };
    { total; pending; accepted; delivered; rejected; totalDeliveredQuantity }
  };

  public query func getLeaderboard() : async [LeaderboardEntry] {
    let tempMap = Map.empty<Text, Nat>();
    for (d in donationsV4.values()) {
      switch (d.status) {
        case (#delivered) {
          let current = switch (tempMap.get(d.donorName)) {
            case (?v) { v };
            case (null) { 0 };
          };
          tempMap.add(d.donorName, current + d.quantity);
        };
        case (_) {};
      };
    };
    let entries : [(Text, Nat)] = tempMap.entries().toArray();
    let mapped = Array.map(entries, func((name, qty) : (Text, Nat)) : LeaderboardEntry {
      { donorName = name; deliveredQuantity = qty }
    });
    let sorted = Array.sort(mapped, func(a : LeaderboardEntry, b : LeaderboardEntry) : { #less; #equal; #greater } {
      if (a.deliveredQuantity > b.deliveredQuantity) { #less }
      else if (a.deliveredQuantity < b.deliveredQuantity) { #greater }
      else { #equal }
    });
    let len = sorted.size();
    let take = if (len > 10) { 10 } else { len };
    Array.subArray(sorted, 0, take)
  };

  // User profiles
  public shared ({ caller }) func setMyProfile(displayName : Text, phone : Text, bio : Text) : async () {
    userProfiles.add(caller, {
      displayName = sanitizeName(displayName);
      phone = sanitizePhone(phone);
      bio = sanitizeBio(bio);
      updatedAt = Time.now();
    });
  };

  public query ({ caller }) func getMyProfile() : async ?UserProfile {
    userProfiles.get(caller)
  };

  public query func getProfile(user : Principal) : async ?UserProfile {
    userProfiles.get(user)
  };

  public query func getAllProfiles() : async [(Principal, UserProfile)] {
    userProfiles.entries().toArray()
  };
}
