---
name: Accounting
description: South African Tax and Markup rules for EventSaaS budgeting and invoicing.
---

# Accounting Skill for EventSaaS

When building, calculating, or auditing the `/budget` page or any financial logic, you MUST apply the following rules exactly:

## 1. Currency & Formats
- **Currency**: ZAR (South African Rand)
- **Symbol**: `R`
- **Format**: `R 1,500.00` (thousands separated by comma, two decimal places)

## 2. Tax (VAT)
- **VAT Rate**: 15%
- All sub-totals should automatically calculate and append 15% VAT for the final Grand Total unless explicitly told otherwise.

## 3. Markup Rules
Different categories of items carry different standard markups before being presented to the client:
- **Equipment (Owned)**: 0% markup (we charge standard rental list price).
- **Equipment (Sub-hire / Cross-hire)**: 30% markup on the supplier cost.
- **Crew**: 0% markup (pass-through cost).
- **Transport**: 15% markup on supplier cost.

## 4. Discount Logic
- Discounts are applied to the **Sub-Total EXCLUDING VAT**.
- VAT is then calculated on the *discounted* Sub-Total.

## Usage
If the user asks you to "Calculate the budget" or "Apply the accounting skill to this invoice", read the data, apply the markups first, calculate the sub-total, subtract discounts, add 15% VAT, and output the Grand Total.
