import { buildBootstrapData } from "./bootstrapData.js";

function sortByStringDateDescending(values, fieldName) {
  return [...values].sort((left, right) =>
    String(right?.[fieldName] ?? "").localeCompare(String(left?.[fieldName] ?? "")),
  );
}

export async function loadServerAppState(db) {
  const [users, requests, tasks, items, restaurants] = await Promise.all([
    db.collection("users").find({}).toArray(),
    db.collection("requests").find({}).toArray(),
    db.collection("tasks").find({}).toArray(),
    db.collection("items").find({}).toArray(),
    db.collection("restaurants").find({}).toArray(),
  ]);

  return {
    bootstrap: buildBootstrapData(items, restaurants),
    users: sortByStringDateDescending(users, "updated_at"),
    requests: sortByStringDateDescending(requests, "submitted_at"),
    tasks: sortByStringDateDescending(tasks, "created_at"),
    items,
    restaurants: sortByStringDateDescending(restaurants, "updated_at"),
  };
}
