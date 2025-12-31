# Dynamic Support Configuration Implementation Plan

## 1. Update Data Models
### `types.ts`
- Update `SupportSettings` interface to include `whatsappNumber: string`.

### `services/mockBackend.ts`
- Update `DEFAULT_SUPPORT_SETTINGS` to include a default `whatsappNumber` (e.g., `+1 555 0199`).

## 2. Update Admin Dashboard
### `pages/AdminDashboard.tsx`
- Locate the internal `SupportView` component.
- Add a new input field for "WhatsApp Number".
- Bind it to the `localSettings` state.
- Ensure saving persists the new field to `mockBackend`.

## 3. Update Client Support View
### `pages/client/SupportView.tsx`
- Refactor the component to fetch `SupportSettings` from `mockBackend` on mount.
- Store settings in local state.
- Replace hardcoded links and text:
    - **WhatsApp**: Use `https://wa.me/<number>` for the link.
    - **Email**: Use `mailto:<financeEmail>` and display the email address.
    - **Phone**: Use `tel:<supportPhone>` and display the phone number.

## 4. Verification
- **Admin**: Verify the new input appears and saves data.
- **Client**: Verify the "Support" page shows the updated values entered in Admin.
- **Driver**: Verify `PayoutsView` displays the correct `financeEmail`.
