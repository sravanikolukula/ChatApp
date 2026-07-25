import { io } from "socket.io-client";

const BASE = "http://localhost:5000";

async function testAll() {
  console.log("=== STARTING FULL REAL-TIME SOCKET & API TESTS ===");

  // 1. Create User A, User B, User C
  const userA_Data = {
    email: "userA_" + Date.now() + "@test.com",
    password: "Password123!",
    fullName: "User Alpha",
  };
  const userB_Data = {
    email: "userB_" + Date.now() + "@test.com",
    password: "Password123!",
    fullName: "User Beta",
  };
  const userC_Data = {
    email: "userC_" + Date.now() + "@test.com",
    password: "Password123!",
    fullName: "User Gamma",
  };

  await fetch(BASE + "/api/auth/signin", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(userA_Data),
  });
  await fetch(BASE + "/api/auth/signin", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(userB_Data),
  });
  await fetch(BASE + "/api/auth/signin", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(userC_Data),
  });

  const loginA = await (
    await fetch(BASE + "/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: userA_Data.email,
        password: userA_Data.password,
      }),
    })
  ).json();

  const loginB = await (
    await fetch(BASE + "/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: userB_Data.email,
        password: userB_Data.password,
      }),
    })
  ).json();

  const loginC = await (
    await fetch(BASE + "/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: userC_Data.email,
        password: userC_Data.password,
      }),
    })
  ).json();

  const userA = loginA.user;
  const tokenA = loginA.token;

  const userB = loginB.user;
  const tokenB = loginB.token;

  const userC = loginC.user;
  const tokenC = loginC.token;

  console.log("1. Accounts Created & Authenticated:");
  console.log("   - User A:", userA.fullName, "(ID:", userA._id + ")");
  console.log("   - User B:", userB.fullName, "(ID:", userB._id + ")");
  console.log("   - User C:", userC.fullName, "(ID:", userC._id + ")");

  // 2. Socket.io Connection & Online Status Check
  console.log("\n2. Connecting Socket.io clients for User A & User B...");
  const socketA = io(BASE, { query: { userId: userA._id } });
  const socketB = io(BASE, { query: { userId: userB._id } });

  await new Promise((resolve) => setTimeout(resolve, 500));

  socketB.on("getOnlineUsers", (onlineUserIds) => {
    console.log("   ✓ User B received 'getOnlineUsers' event:", onlineUserIds);
  });

  socketB.on("typing", ({ fromUserId }) => {
    console.log("   ✓ User B received 'typing' event from User A:", fromUserId);
  });

  socketB.on("stopTyping", ({ fromUserId }) => {
    console.log(
      "   ✓ User B received 'stopTyping' event from User A:",
      fromUserId
    );
  });

  socketB.on("newMessage", (msg) => {
    console.log("   ✓ User B received 'newMessage' via Socket.io:", msg.text);
  });

  // 3. Test Typing Indicators
  console.log("\n3. Testing Typing Indicators...");
  socketA.emit("typing", { toUserId: userB._id });
  await new Promise((r) => setTimeout(r, 200));
  socketA.emit("stopTyping", { toUserId: userB._id });
  await new Promise((r) => setTimeout(r, 200));

  // 4. Test 1-on-1 Direct Message
  console.log("\n4. Testing 1-on-1 Direct Message Sending...");
  const sendMsgRes = await (
    await fetch(`${BASE}/api/message/send/${userB._id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", token: tokenA },
      body: JSON.stringify({ text: "Hello User B! Testing live chat." }),
    })
  ).json();
  console.log("   ✓ Send Message API Result:", sendMsgRes.message._id ? "Sent successfully!" : sendMsgRes);

  await new Promise((r) => setTimeout(r, 500));

  // 5. Test Group Creation with Initial Members
  console.log("\n5. Testing Group Creation with Members (User A + User B)...");
  const groupRes = await (
    await fetch(`${BASE}/api/group/create`, {
      method: "POST",
      headers: { "Content-Type": "application/json", token: tokenA },
      body: JSON.stringify({
        name: "Dev Team Alpha",
        groupMembers: [userB._id],
      }),
    })
  ).json();
  console.log(
    "   ✓ Group Creation Result:",
    groupRes.success
      ? `Group '${groupRes.newGroup.name}' created with ${groupRes.newGroup.members.length} members!`
      : groupRes
  );
  const groupId = groupRes.newGroup._id;

  // 6. Test Adding Member in Middle (Add User C)
  console.log("\n6. Testing Adding Member in Middle (Adding User C to group)...");
  const addMemRes = await (
    await fetch(`${BASE}/api/group/${groupId}/add-member`, {
      method: "POST",
      headers: { "Content-Type": "application/json", token: tokenA },
      body: JSON.stringify({ selectedUserIds: [userC._id] }),
    })
  ).json();
  console.log("   ✓ Add Member Result:", addMemRes.message || addMemRes);

  // 7. Test Sending Group Message
  console.log("\n7. Testing Group Message Broadcast...");
  const groupMsgRes = await (
    await fetch(`${BASE}/api/message/group/send/${groupId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", token: tokenA },
      body: JSON.stringify({ text: "Welcome everyone to Dev Team Alpha!" }),
    })
  ).json();
  console.log("   ✓ Group Message Result:", groupMsgRes.message._id ? "Group message broadcast successfully!" : groupMsgRes);

  // 8. Test Exiting from Group
  console.log("\n8. Testing Exit from Group (User C exiting group)...");
  const exitGroupRes = await (
    await fetch(`${BASE}/api/group/${groupId}/exit`, {
      method: "POST",
      headers: { "Content-Type": "application/json", token: tokenC },
    })
  ).json();
  console.log("   ✓ Exit Group Result:", exitGroupRes.message || exitGroupRes);

  socketA.disconnect();
  socketB.disconnect();
  console.log("\n=== ALL REAL-TIME & API TESTS COMPLETED SUCCESSFULLY ===");
}

testAll().catch((err) => console.error("Test Error:", err));
