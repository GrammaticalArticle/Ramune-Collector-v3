import { Router } from "express";
import { db } from "@workspace/db";
import { usersTable, friendshipsTable } from "@workspace/db";
import { eq, and, asc } from "drizzle-orm";
import {
  CreateUserBody,
  GetUserParams,
  GetFriendsParams,
  AddFriendParams,
  AddFriendBody,
  RemoveFriendParams,
} from "@workspace/api-zod";

const router = Router();

router.get("/users", async (req, res) => {
  try {
    const users = await db.select().from(usersTable).orderBy(asc(usersTable.username));
    res.json(users);
  } catch (err) {
    req.log.error({ err }, "Failed to list users");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/users", async (req, res) => {
  const parsed = CreateUserBody.safeParse(req.body);
  if (!parsed.success) return void res.status(400).json({ error: "Invalid request body" });

  const { username, displayName } = parsed.data;
  const cleanUsername = username.toLowerCase().trim().replace(/[^a-z0-9_]/g, "");
  if (!cleanUsername) return void res.status(400).json({ error: "Invalid username" });

  try {
    // Upsert: create or return existing
    const existing = await db.select().from(usersTable).where(eq(usersTable.username, cleanUsername));
    if (existing.length > 0) return void res.json(existing[0]);

    const [user] = await db
      .insert(usersTable)
      .values({ username: cleanUsername, displayName })
      .returning();
    res.json(user);
  } catch (err) {
    req.log.error({ err }, "Failed to create user");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/users/:username", async (req, res) => {
  const parsed = GetUserParams.safeParse(req.params);
  if (!parsed.success) return void res.status(400).json({ error: "Invalid username" });

  try {
    const [user] = await db.select().from(usersTable).where(eq(usersTable.username, parsed.data.username));
    if (!user) return void res.status(404).json({ error: "User not found" });
    res.json(user);
  } catch (err) {
    req.log.error({ err }, "Failed to get user");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/users/:username/friends", async (req, res) => {
  const parsed = GetFriendsParams.safeParse(req.params);
  if (!parsed.success) return void res.status(400).json({ error: "Invalid username" });

  try {
    const friendships = await db
      .select()
      .from(friendshipsTable)
      .where(eq(friendshipsTable.username, parsed.data.username));

    const friends = await Promise.all(
      friendships.map(async (f) => {
        const [user] = await db.select().from(usersTable).where(eq(usersTable.username, f.friendUsername));
        return user;
      })
    );

    res.json(friends.filter(Boolean));
  } catch (err) {
    req.log.error({ err }, "Failed to get friends");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/users/:username/friends", async (req, res) => {
  const paramsParsed = AddFriendParams.safeParse(req.params);
  if (!paramsParsed.success) return void res.status(400).json({ error: "Invalid username" });
  const bodyParsed = AddFriendBody.safeParse(req.body);
  if (!bodyParsed.success) return void res.status(400).json({ error: "Invalid request body" });

  const { username } = paramsParsed.data;
  const { friendUsername } = bodyParsed.data;

  if (username === friendUsername) return void res.status(400).json({ error: "Cannot add yourself as a friend" });

  try {
    const [friend] = await db.select().from(usersTable).where(eq(usersTable.username, friendUsername));
    if (!friend) return void res.status(404).json({ error: "User not found" });

    const existing = await db
      .select()
      .from(friendshipsTable)
      .where(and(eq(friendshipsTable.username, username), eq(friendshipsTable.friendUsername, friendUsername)));
    if (existing.length > 0) return void res.status(409).json({ error: "Already friends" });

    await db.insert(friendshipsTable).values({ username, friendUsername });
    res.status(201).json(friend);
  } catch (err) {
    req.log.error({ err }, "Failed to add friend");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/users/:username/friends/:friendUsername", async (req, res) => {
  const parsed = RemoveFriendParams.safeParse(req.params);
  if (!parsed.success) return void res.status(400).json({ error: "Invalid params" });

  try {
    const [deleted] = await db
      .delete(friendshipsTable)
      .where(
        and(
          eq(friendshipsTable.username, parsed.data.username),
          eq(friendshipsTable.friendUsername, parsed.data.friendUsername)
        )
      )
      .returning();
    if (!deleted) return void res.status(404).json({ error: "Friendship not found" });
    res.status(204).end();
  } catch (err) {
    req.log.error({ err }, "Failed to remove friend");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
