# 🧾 The Bodyworks Club — Invoice System

A simple invoice-generation web application for gyms.
Built with **Next.js**, **Prisma**, **PostgreSQL**, and **TailwindCSS**, focused on fast internal invoicing, GST handling, and thermal printing.

---

## ⭐ Features (V1)

### ✔ Invoice Creation

* Select membership plan
* Custom plan option
* 18% GST automatically calculated

  * 9% CGST + 9% SGST
* Non-taxable items:

  * Personal Trainer
  * Registration fee
* Auto-generated invoice number

### ✔ Invoice Preview & Print

* Thermal printer friendly layout
* Browser print support
* Includes:

  * gym info
  * customer info
  * GST breakdown

### ✔ Invoice History

* List of all invoices
* Search by name/phone/invoice code
* Filter date range (Today / Week / Month / All)
* CSV export

---

## 🧮 Plans (pre-configured)

| Plan             | Duration    | Base Price | GST        |
| ---------------- | ----------- | ---------- | ---------- |
| Basic            | 30 days     | ₹1499      | 18%        |
| Standard         | 90 days     | ₹3999      | 18%        |
| Premium          | 180 days    | ₹7499      | 18%        |
| Ultimate         | 360 days    | ₹11999     | 18%        |
| Daily            | 1 day       | ₹249       | 18%        |
| Personal Trainer | 20 sessions | ₹7999      | **No GST** |
| Registration Fee | —           | ₹499       | **No GST** |

---

## 🧩 Tech Stack

| Layer          | Technology                     |
| -------------- | ------------------------------ |
| Frontend       | Next.js (App Router)           |
| Styling        | TailwindCSS                    |
| Database       | PostgreSQL                     |
| ORM            | Prisma                         |
| Deployment     | Vercel (recommended)           |
| Authentication | Simple PIN based (no roles V1) |

---

## 📂 Important Directories

```
app/
  invoices/
     new/          → New invoice form
     [invoiceCode]/ → Invoice preview & print
  api/
     invoices/     → GET + POST
     invoices/export → CSV endpoint
lib/
  db.ts
  calculations.ts
prisma/
  schema.prisma
```

---

## 🚀 Running Locally

### Clone

```sh
git clone https://github.com/Afraann/TheBodyworksClub-Invoice.git
cd thebodyworksclub-invoice
```

### Install

```sh
npm install
```

### Environment file

Create `.env`:

```sh
DATABASE_URL="postgres://..."
NEXTAUTH_SECRET="anything"
```

### Setup DB

```sh
npx prisma migrate dev --name init
npx prisma db seed
```

### Start

```sh
npm run dev
```

Open:
[http://localhost:3000](http://localhost:3000)

---

## 🔐 Authentication

V1 uses **single shared PIN** authentication.
PIN defined in environment or code (depending on implementation).
For multi-branch & roles → planned future release.

---

## 📦 API Endpoints

| Method | Route                  | Description    |
| ------ | ---------------------- | -------------- |
| POST   | `/api/invoices`        | Create invoice |
| GET    | `/api/invoices`        | List invoices  |
| GET    | `/api/invoices/export` | Download CSV   |

---

## 🖨 Printing Support

* Works directly from browser (Ctrl+P / Cmd+P)
* Thermal printer friendly
* Minimal ink usage
* Compact layout

---

## 🧭 Roadmap (Planned)

* Branch switcher
* Owner vs staff accounts
* Dashboard charts
* Membership database integration
* WhatsApp invoice share
* Dark mode (gym theme red + black)

---

## 👨‍💻 Developer

* Built by **BlankSpace Agency**
* Project scope: minimal operational invoice module for gym usage
* Fully owned & deployed for client - The BodyworksClub

---

## 🏁 Version

`v1.0.0` — Invoice, preview, search, CSV export
