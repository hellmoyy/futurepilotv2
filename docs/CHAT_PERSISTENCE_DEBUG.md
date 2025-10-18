# Debug Guide - Chat Persistence Testing

## 🧪 Testing Steps dengan Manual Save Button

### Step 1: Clear Everything
```javascript
// Open browser console (F12)
localStorage.clear()
// Reload page (Cmd+R)
```

### Step 2: Send a Message
1. Type a message in AI Agent
2. Click Send
3. Wait for AI response

### Step 3: Check Status Bar
Look at the status indicators:
- **💬 X messages • Session: xxxxxxxx** - Shows message count and session ID
- **✅ Saved** badge - Should NOT appear yet (chat not saved)

### Step 4: Manual Save (Testing)
1. Click the **💾 Save** button (appears after first message)
2. Watch browser console for logs:
   ```
   💾 Attempting to save chat...
   📤 Sending save request...
   📥 Response status: 200 OK
   📥 Response data: { success: true, ... }
   ✅ Chat saved successfully: session_xxx
   💾 Saved to localStorage: session_xxx
   ```

3. **✅ Saved** badge should now appear in status bar

### Step 5: Reload Page
1. Reload page (Cmd+R)
2. Watch console for restore logs:
   ```
   ✅ Restored previous chat session: session_xxx
   ```
3. Chat should be restored with all messages!

---

## 🔍 Console Logs to Monitor

### During Save:
```
💾 Attempting to save chat... {sessionId, messageCount, hasUserMessages}
📤 Sending save request... {sessionId, formattedMessageCount}
📥 Response status: 200 OK
📥 Response data: {success: true, ...}
✅ Chat saved successfully: session_xxx
💾 Saved to localStorage: session_xxx
```

### During Page Load:
```
ℹ️ No previous session found, starting fresh
  OR
⚠️ Session not found in database, starting fresh
  OR
✅ Restored previous chat session: session_xxx
```

### If Save Fails:
```
❌ Failed to save chat: error message
  OR
❌ Error saving chat: error object
```

---

## 🎯 What to Check

### 1. **Status Bar Indicators**
- Message count updates correctly
- Session ID shown (last 8 chars)
- ✅ Saved badge appears after manual save
- ⚠️ Error message if something fails

### 2. **Manual Save Button**
- Only appears when messages.length > 1
- Shows "💾 Saving..." during save
- Returns to save icon when done

### 3. **localStorage**
```javascript
// Check what's in localStorage
localStorage.getItem('ai-agent-current-session')
// Should return: "session_1234567890" after save
```

### 4. **Console Logs**
- Clear, detailed logs at each step
- ✅ Success = green checkmark
- ⚠️ Warning = warning sign
- ❌ Error = red X
- 💾 Action = floppy disk

---

## 🐛 Common Issues

### Issue 1: Save button appears but save fails
**Check:**
```javascript
// Console should show:
❌ Response status: 401 Unauthorized
  OR
❌ Response status: 500 Internal Server Error
```

**Solution:**
- 401: Not logged in - refresh page and login again
- 500: Server error - check backend logs

### Issue 2: Save succeeds but restore fails
**Check:**
```javascript
// On reload, console should show:
✅ Restored previous chat session: session_xxx
```

**If shows:**
```
⚠️ Session not found in database, starting fresh
```

**Solution:**
- Session was saved to localStorage but not to DB
- Check save logs to see if DB save actually succeeded
- Try manual save again

### Issue 3: Auto-save not working
**Check:**
1. Does manual save work? (Click save button)
2. If manual save works but auto-save doesn't:
   - Wait full 30 seconds after last message
   - Check console for auto-save trigger

---

## ✅ Success Checklist

After testing, you should see:

1. ✅ Send message → Message appears
2. ✅ Click manual save → Console shows success logs
3. ✅ Status bar shows "✅ Saved" badge
4. ✅ Reload page → Chat restored
5. ✅ Console shows "✅ Restored previous chat session"
6. ✅ All messages appear correctly
7. ✅ Can continue chatting
8. ✅ Can save again
9. ✅ Can reload again - still works

---

## 🔧 Debug Commands

### Check localStorage:
```javascript
console.log('Current session:', localStorage.getItem('ai-agent-current-session'));
```

### Force clear and restart:
```javascript
localStorage.removeItem('ai-agent-current-session');
location.reload();
```

### Check if session exists in DB (manual):
```javascript
const sessionId = localStorage.getItem('ai-agent-current-session');
fetch(`/api/ai/chat-history/${sessionId}`)
  .then(r => r.json())
  .then(d => console.log('DB session:', d));
```

### Trigger manual save from console:
```javascript
// Only works if you have reference to component
// Use the manual save button in UI instead
```

---

## 📊 Expected Timeline

```
00:00 - User sends first message
00:01 - AI responds
00:02 - User clicks manual save button
00:03 - Save to DB successful
00:04 - localStorage updated
00:05 - "✅ Saved" badge appears
00:06 - User reloads page
00:07 - Chat restored from DB
00:08 - User continues chatting
00:30 - Auto-save triggers (30s after last message)
00:31 - Auto-save successful
```

---

## 🎯 Final Test

1. Clear localStorage
2. Send 3 messages (chat with AI)
3. Click manual save button
4. See "✅ Saved" badge
5. Reload page
6. See all 3 messages restored
7. Send 1 more message
8. Wait 30 seconds (auto-save)
9. Reload page
10. See all 4 messages restored

**If all 10 steps work → Feature is working correctly! ✅**

---

**Last Updated:** October 18, 2025
**Purpose:** Debug and test chat persistence feature
