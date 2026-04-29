#!/usr/bin/env node
/**
 * Role Request Flow Test Script
 * Tests each step of the delivery boy request flow
 */

const API_BASE = "http://localhost:5000/api";

// Get token from user input
const args = process.argv.slice(2);
const token = args[0];

if (!token) {
  console.error("❌ Usage: node test-role-flow.js <your-auth-token>");
  console.error("   Get token from localStorage['token'] in browser console");
  process.exit(1);
}

async function test(name, method, endpoint, body = null) {
  console.log(`\n🧪 TEST: ${name}`);
  console.log(`   ${method} ${API_BASE}${endpoint}`);
  
  try {
    const options = {
      method,
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      }
    };
    
    if (body) {
      options.body = JSON.stringify(body);
    }
    
    const response = await fetch(`${API_BASE}${endpoint}`, options);
    const data = await response.json();
    
    if (response.ok) {
      console.log(`✅ SUCCESS (${response.status})`);
      console.log(JSON.stringify(data, null, 2));
      return data;
    } else {
      console.log(`❌ ERROR (${response.status})`);
      console.log(JSON.stringify(data, null, 2));
      return null;
    }
  } catch (error) {
    console.log(`❌ FETCH ERROR: ${error.message}`);
    return null;
  }
}

async function runTests() {
  console.log("🚀 ROLE REQUEST FLOW TEST SUITE\n");
  
  // Test 1: Check current user's role and permissions
  console.log("═══════════════════════════════════════════════════════════");
  console.log("STEP 1: Check Your Current Role & Permissions");
  console.log("═══════════════════════════════════════════════════════════");
  const userCheck = await test(
    "Get current user info and permissions",
    "GET",
    "/role/debug/check-user"
  );
  
  if (!userCheck) {
    console.log("\n⚠️  Could not check user. Check token is valid.");
    return;
  }
  
  const userRole = userCheck.user?.role;
  console.log(`\n👤 Your Role: ${userRole}`);
  console.log(`✅ Can approve delivery boys? ${userCheck.permissions?.canApprovePendingDeliveryBoys}`);
  console.log(`✅ Can view history? ${userCheck.permissions?.canViewApprovalHistory}`);
  
  // Test 2: Check ALL pending delivery boy requests in database
  console.log("\n═══════════════════════════════════════════════════════════");
  console.log("STEP 2: Check ALL Pending Delivery Boy Requests in Database");
  console.log("═══════════════════════════════════════════════════════════");
  const allPending = await test(
    "Get all pending delivery boy requests",
    "GET",
    "/role/debug/pending-delivery-boys"
  );
  
  if (allPending) {
    console.log(`\n📊 Total pending delivery boy requests: ${allPending.totalPendingDeliveryBoyRequests}`);
    if (allPending.requests && allPending.requests.length > 0) {
      console.log("📋 Requests:");
      allPending.requests.forEach((req, idx) => {
        console.log(`   ${idx + 1}. ${req.userName} (${req.requestedRole}) - Status: ${req.status}`);
      });
    } else {
      console.log("   ⚠️  No pending delivery boy requests found!");
    }
  }
  
  // Test 3: Try to get pending as this user
  console.log("\n═══════════════════════════════════════════════════════════");
  console.log("STEP 3: Get Pending Requests (What YOUR role sees)");
  console.log("═══════════════════════════════════════════════════════════");
  const myPending = await test(
    "Get pending requests visible to your role",
    "GET",
    "/role/pending"
  );
  
  if (myPending) {
    if (userRole === "subAdmin") {
      console.log(`\n✅ You are Sub-Admin`);
      console.log(`📊 You can see ${myPending.totalRequests || myPending.requests?.length || 0} pending delivery boy requests`);
      if (myPending.requests && myPending.requests.length > 0) {
        console.log("📋 Your Requests:");
        myPending.requests.forEach((req, idx) => {
          console.log(`   ${idx + 1}. ${req.userName} - Status: ${req.status}`);
        });
      } else {
        console.log("   ❌ You see NO pending requests!");
        console.log("   But check STEP 2 above - are there any pending requests in DB?");
      }
    } else if (userRole === "admin") {
      console.log(`\n✅ You are Admin - checking history instead`);
    } else {
      console.log(`\n⚠️  You are ${userRole} - cannot see pending requests`);
    }
  }
  
  // Summary
  console.log("\n═══════════════════════════════════════════════════════════");
  console.log("📊 SUMMARY");
  console.log("═══════════════════════════════════════════════════════════");
  
  if (!userCheck) {
    console.log("❌ Could not verify user - token may be invalid");
  } else if (userRole !== "subAdmin") {
    console.log(`❌ You must be a Sub-Admin to see pending requests (You are: ${userRole})`);
    console.log("   Have admin make you a sub-admin first");
  } else if (allPending && allPending.totalPendingDeliveryBoyRequests === 0) {
    console.log("❌ No pending delivery boy requests exist in database");
    console.log("   Have someone submit a delivery boy request first");
  } else if (myPending && myPending.requests?.length === 0) {
    console.log("❌ Requests exist in DB but NOT showing to sub-admin");
    console.log("   This is a QUERY BUG - check server logs!");
  } else {
    console.log("✅ Everything working! Requests are visible");
  }
}

runTests().catch(console.error);
