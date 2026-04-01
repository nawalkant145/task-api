# Bug Report

## Bug 1: `completeTask` overrides task priority
- **Expected Behavior:** Marking a task as complete using `PATCH /tasks/:id/complete` should only update the `status` to `done` and set `completedAt`. The task's `priority` should remain unchanged.
- **Actual Behavior:** The `completeTask` function in `taskService.js` explicitly hardcodes `priority: 'medium'` on the updated task object, overwriting any `high` or `low` priority the task might have had.
- **How I Discovered It:** I found this while reading the implementation of `completeTask` in `src/services/taskService.js`, and it also caused unit tests checking for unmodified fields to fail.
- **Fix:** Remove `priority: 'medium'` from the `updated` object construction in `completeTask`.

## Bug 2: Partial matching for `getByStatus`
- **Expected Behavior:** Querying `/tasks?status=todo` or using `getByStatus('do')` should exactly match tasks with the specified status.
- **Actual Behavior:** `getByStatus` uses `t.status.includes(status)`. This means querying for "do" would return both "todo" and "done" tasks, and it's prone to bugs if other statuses are added.
- **How I Discovered It:** I noticed the usage of `.includes()` while reviewing `taskService.js` methods, which performs a substring check rather than an equality check.
- **Fix:** Update `getByStatus` to use strict equality: `t.status === status`.

## Bug 3: `update` allows modifying protected fields like `id` and `createdAt`
- **Expected Behavior:** When updating a task (`PUT /tasks/:id`), standard mutable fields like `title` and `status` can be updated, but protected/system-managed fields like `id` and `createdAt` should not be overridden by the user.
- **Actual Behavior:** The `update` function directly spreads `...fields` over the existing task object without filtering out protected keys.
- **How I Discovered It:** While inspecting the `update` method, it was evident that the request body can maliciously inject any key.
- **Fix:** Destructure out `id` and `createdAt` from `fields`, and only spread the remaining `allowedFields` onto the updated task object.
