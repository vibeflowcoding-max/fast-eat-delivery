# 🎨 Fast Eat - Branding & UI Guide for Expo Clone

This document provides all the necessary design specifications and screen mappings to build a mobile clone of the Fast Eat delivery application using Expo and React Native.

---

## 🏗 Branding & Design Tokens

### 1. Color Palette
The app uses a clean, mobile-first palette with a slight cream background and professional slate-primary tones.

| Name | Hex / Value | Usage |
| :--- | :--- | :--- |
| **Primary** | `#6A7282` | Main buttons (grayish-blue), borders, icons. |
| **Accent** | `#F3F4F6` | Secondary backgrounds, subtle badges. |
| **Background** | `#FDFCF0` | Main application background (Cream). |
| **Text** | `#101828` | Main headings and body text. |
| **Card / White** | `#FFFFFF` | Card backgrounds. |
| **Success** | `#22C55E` | Accept buttons, success badges. |
| **Destructive** | `#EF4444` | Delete / Logout / Errors. |
| **Secondary Text** | `#6B7280` | Muted labels and subtitles. |

### 2. Typography
- **Sans-Serif (System/Inter)**: Used for all UI controls and body text.
- **Heading (Serif/Bold)**: Used for screen titles and restaurant names in cards.
- **Sizes**:
  - `H1`: 32px (Bold)
  - `H2`: 24px (Bold)
  - `Body`: 16px
  - `Small`: 14px
  - `Tiny`: 12px (Bold uppercase for labels)

### 3. Spacing & Shapes
- **Border Radius**: `16px` (Standard for cards and main buttons).
- **Default Padding**: `16px` or `24px` for screen containers.
- **Card Padding**: `16px`.

---

## 🧩 UI Components

### 1. Buttons
- **Primary (Accept Order)**: Full-width, Gradient `from-green-500 to-green-600`, Radius `12px`, Bold text.
- **Action (Finalize Delivery)**: Full-width, Primary color `#6A7282`, Height `48px`.
- **Outline**: White background, Primary border `#6A7282/20`, Text `#6A7282`.

### 2. Cards
#### 📦 OrderCard (Feed & Active)
- **Header**: Restaurant name (Large bold), Status Badge (e.g., "Preparando"), Amount Badge (e.g., "₡2,500").
- **Section - Pickup**: Shop icon, Restaurant address, "Ver Ubicación 📍" link.
- **Section - Delivery**: User icon, Customer name, Address, "Maps/Waze" buttons.
- **Items**: List of `Quantity x Name` (Small text).
- **Footer**: Large action button (Accept or Complete).

#### 📊 StatsCard
- Icon/Emoji (Left).
- Title (Small muted).
- Value (Large bold).
- Subtitle (Tiny muted).

### 3. Input Fields
- **Standard**: Border `#E5E7EB`, Focus border `#primary`, Radius `8px`.
- **Verification Code**: Large, monospace, 6 characters, centered, tracking-widest text.

---

## 📱 Screens & Navigation

The app is strictly **Mobile-First**.

### 1. Navigation Flow
- **Auth**: `Login` -> `Feed`.
- **Main (Bottom Tabs)**:
  - 🏠 **Feed**: Home screen with stats and available orders.
  - 📊 **History**: List of past deliveries.
  - 👤 **Profile**: Settings and user info.

### 2. Detailed Screens

#### 🏠 Feed Screen (`/dashboard/feed`)
- Top: Grid of 3 `StatsCards` (Deliveries Today, Earnings Today, This Month).
- Center: Vertical list of `OrderCards` (Status: FEED).
- Pull-to-refresh enabled.

#### 🎯 Active Order (`/dashboard/active-order`)
- Appears when an order is accepted.
- Shows the full `OrderCard` with extra interaction.
- **Stage 1 (At Restaurant)**: Shows restaurant details.
- **Stage 2 (In Transit)**: Verification Code input appears.
- **Verification**: Input field for the 6-digit code provided by the customer.

#### 📊 History Screen (`/dashboard/history`)
- Top: Filter buttons (All, Today, Week).
- Summary: Total deliveries and Earnings for the selected period.
- List: `DeliveryCard` with Order Number, Date, Amount.

#### 👤 Profile Screen (`/dashboard/profile`)
- Header: User Avatar (Lottie/Icon), Name, Email.
- Statistics: Detailed stats grid.
- Settings: Toggle for Notifications, Notification permission button.
- Actions: "Ver Historial", "Cerrar Sesión" (Red).

---

## 🛠 React Native Equivalents
- **Icons**: `lucide-react-native`.
- **Animations**: `lottie-react-native`.
- **Navigation**: `expo-router` (Tabs & Stack).
- **Styling**: `NativeWind` (Tailwind for React Native) or `StyleSheet`.
- **Shadows**: Use elevation on Android and shadowProps on iOS for that "Card" look.

---
*Fast Eat - Build with 🍔 and 🚀*
