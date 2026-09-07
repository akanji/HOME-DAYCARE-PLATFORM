# Security Specification: Home Daycare Platform

## 1. Data Invariants
- **Users**: A user document at `users/{userId}` can only be read or written by the authenticated user whose `request.auth.uid == userId`, or an administrator. Role escalation is blocked.
- **Children**: Children belong to a registered provider (`providerId == request.auth.uid`). Only the provider or administrators can manage or list child records.
- **Attendance**: Records must reference a valid child and provider. Only the authenticated provider can log or update check-ins.
- **Safety Tasks & Incidents**: Safety tasks and incident reports require an authenticated provider owner and valid status state transitions.

## 2. The Dirty Dozen Payloads (Targeting Exploits)
1. Impersonate user profile update with altered UID (`uid != request.auth.uid`).
2. Self-escalation to admin role via client write (`role: 'admin'`).
3. Reading another provider's children records (`providerId != request.auth.uid`).
4. Writing child document with negative age or oversized 2MB payload strings.
5. Injected script tags or malicious URLs inside child medication or allergies.
6. Altering attendance verification time to future dates.
7. Unauthenticated attendance deletion.
8. Modifying daily report after parental sign-off.
9. Deleting critical incident logs without administrative role.
10. Unbounded string injection into safety task IDs.
11. Bypassing provider isolation on multi-child queries (`allow list: if isSignedIn()` without `resource.data.providerId == request.auth.uid`).
12. Attempting to modify immutable creation timestamps.
