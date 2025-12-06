// app/api/invoices/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import {
  calculateInvoiceTotals,
  type LineItemInput,
} from '@/lib/calculations';
import { InvoiceItemType } from '@prisma/client';

const CUSTOM_PLAN_CODE = 'CUSTOM';
const PT_PLAN_CODE = 'PT_20_SESSIONS';

function badRequest(message: string, details?: Record<string, string>) {
  return NextResponse.json(
    {
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message,
        details,
      },
    },
    { status: 400 },
  );
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));

    const customerName = (body?.customerName ?? '').toString().trim();
    const customerPhone = (body?.customerPhone ?? '').toString().trim();
    const membership = body?.membership ?? {};
    const customMembership = body?.customMembership ?? null;
    const registrationFeeRaw = body?.registrationFee ?? 0;
    const includePersonalTrainer = Boolean(body?.includePersonalTrainer);

    // Basic validation
    if (!customerName) {
      return badRequest('Customer name is required', {
        customerName: 'Customer name is required',
      });
    }

    if (!customerPhone) {
      return badRequest('Customer phone is required', {
        customerPhone: 'Customer phone is required',
      });
    }

    const planCode = (membership?.planCode ?? '').toString().trim();

    if (!planCode) {
      return badRequest('Membership plan code is required', {
        'membership.planCode': 'Plan code is required',
      });
    }

    let membershipLabel: string;
    let membershipAmount: number;
    let membershipDurationDays: number | null = null;
    let membershipPlanId: string | null = null;
    let membershipIsTaxable = true;
    let membershipGstRate = 18;

    // 1) Membership: pre-defined OR custom
    if (planCode === CUSTOM_PLAN_CODE) {
      // Custom membership
      if (
        !customMembership ||
        !customMembership.label ||
        customMembership.amount == null
      ) {
        return badRequest('Custom membership details are required', {
          'customMembership.label': 'Custom label is required',
          'customMembership.amount': 'Custom amount is required',
        });
      }

      membershipLabel = customMembership.label.toString().trim();
      membershipAmount = Number(customMembership.amount);
      membershipDurationDays =
        customMembership.durationDays != null
          ? Number(customMembership.durationDays)
          : null;

      if (!membershipLabel) {
        return badRequest('Custom membership label is required', {
          'customMembership.label': 'Custom label is required',
        });
      }
      if (!Number.isFinite(membershipAmount) || membershipAmount <= 0) {
        return badRequest('Custom membership amount must be > 0', {
          'customMembership.amount': 'Amount must be a positive number',
        });
      }

      membershipIsTaxable = true;
      membershipGstRate = 18;
    } else {
      // Pre-defined membership plan (from DB)
      const plan = await prisma.plan.findFirst({
        where: {
          code: planCode,
          isActive: true,
        },
      });

      if (!plan) {
        return badRequest('Invalid membership plan code', {
          'membership.planCode': 'Plan not found or inactive',
        });
      }

      membershipPlanId = plan.id;
      membershipLabel = plan.name;
      membershipAmount = Number(plan.baseAmount);
      membershipDurationDays = plan.durationDays;
      membershipIsTaxable = plan.isTaxable;
      membershipGstRate = Number(plan.gstRate);
    }

    // 2) Registration fee (non-taxable)
    const registrationFee = Number(registrationFeeRaw || 0);
    if (Number.isNaN(registrationFee) || registrationFee < 0) {
      return badRequest('Registration fee must be a non-negative number', {
        registrationFee: 'Must be a number >= 0',
      });
    }

    // 3) Personal Trainer plan (non-taxable, from DB)
    let ptPlanAmount: number | null = null;
    let ptPlanId: string | null = null;
    let ptLabel: string | null = null;

    if (includePersonalTrainer) {
      const ptPlan = await prisma.plan.findFirst({
        where: {
          code: PT_PLAN_CODE,
          isActive: true,
        },
      });

      if (!ptPlan) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'CONFIG_ERROR',
              message: 'Personal Trainer plan not configured in database',
            },
          },
          { status: 500 },
        );
      }

      ptPlanId = ptPlan.id;
      ptPlanAmount = Number(ptPlan.baseAmount);
      ptLabel = ptPlan.name;
    }

    // 4) Build line items for calculation
    const calcItems: LineItemInput[] = [];

    // Membership (taxable, 18% or from plan)
    calcItems.push({
      amount: membershipAmount,
      isTaxable: membershipIsTaxable,
      gstRate: membershipGstRate,
    });

    // Registration fee (non-taxable)
    if (registrationFee > 0) {
      calcItems.push({
        amount: registrationFee,
        isTaxable: false,
        gstRate: 0,
      });
    }

    // Personal trainer (non-taxable)
    if (includePersonalTrainer && ptPlanAmount != null) {
      calcItems.push({
        amount: ptPlanAmount,
        isTaxable: false,
        gstRate: 0,
      });
    }

    const totals = calculateInvoiceTotals(calcItems);

    // 5) Persist invoice + items in a transaction
    const createdInvoice = await prisma.$transaction(async (tx) => {
      // Get branch (first active for now)
      const branch = await tx.branch.findFirst({
        where: { isActive: true },
      });

      if (!branch) {
        throw new Error('NO_BRANCH_CONFIGURED');
      }

      // Compute next invoice number
      const lastInvoice = await tx.invoice.findFirst({
        orderBy: {
          invoiceNumber: 'desc',
        },
        select: {
          invoiceNumber: true,
        },
      });

      const nextInvoiceNumber = (lastInvoice?.invoiceNumber ?? 0) + 1;
      const invoiceCode = nextInvoiceNumber.toString().padStart(3, '0');

      const itemsToCreate = [];

      // Membership item
      itemsToCreate.push({
        itemType: InvoiceItemType.MEMBERSHIP,
        description: membershipLabel,
        durationDays: membershipDurationDays,
        quantity: 1,
        baseAmount: membershipAmount,
        lineTotalBeforeTax: membershipAmount,
        isTaxable: membershipIsTaxable,
        gstRate: membershipGstRate,
        planId: membershipPlanId,
      });

      // Registration fee item
      if (registrationFee > 0) {
        itemsToCreate.push({
          itemType: InvoiceItemType.REGISTRATION_FEE,
          description: 'Registration Fee',
          durationDays: null,
          quantity: 1,
          baseAmount: registrationFee,
          lineTotalBeforeTax: registrationFee,
          isTaxable: false,
          gstRate: 0,
          planId: null,
        });
      }

      // Personal trainer item
      if (includePersonalTrainer && ptPlanAmount != null && ptLabel) {
        itemsToCreate.push({
          itemType: InvoiceItemType.PERSONAL_TRAINER,
          description: ptLabel,
          durationDays: null,
          quantity: 1,
          baseAmount: ptPlanAmount,
          lineTotalBeforeTax: ptPlanAmount,
          isTaxable: false,
          gstRate: 0,
          planId: ptPlanId,
        });
      }

      const invoice = await tx.invoice.create({
        data: {
          branchId: branch.id,
          invoiceNumber: nextInvoiceNumber,
          invoiceCode,
          invoiceDate: new Date(),
          customerName,
          customerPhone,
          taxableSubtotal: totals.taxableSubtotal,
          cgstAmount: totals.cgstAmount,
          sgstAmount: totals.sgstAmount,
          totalGst: totals.totalGst,
          nontaxableSubtotal: totals.nontaxableSubtotal,
          grandTotal: totals.grandTotal,
          items: {
            create: itemsToCreate,
          },
        },
        include: {
          items: true,
        },
      });

      return invoice;
    });

    // 6) Map Prisma Decimal to numbers in response
    const responseInvoice = {
      id: createdInvoice.id,
      invoiceNumber: createdInvoice.invoiceNumber,
      invoiceCode: createdInvoice.invoiceCode,
      invoiceDate: createdInvoice.invoiceDate,
      customerName: createdInvoice.customerName,
      customerPhone: createdInvoice.customerPhone,
      taxableSubtotal: Number(createdInvoice.taxableSubtotal),
      cgstAmount: Number(createdInvoice.cgstAmount),
      sgstAmount: Number(createdInvoice.sgstAmount),
      totalGst: Number(createdInvoice.totalGst),
      nontaxableSubtotal: Number(createdInvoice.nontaxableSubtotal),
      grandTotal: Number(createdInvoice.grandTotal),
      isVoid: createdInvoice.isVoid,
      createdAt: createdInvoice.createdAt,
      updatedAt: createdInvoice.updatedAt,
      items: createdInvoice.items.map((i) => ({
        id: i.id,
        itemType: i.itemType,
        description: i.description,
        durationDays: i.durationDays,
        quantity: i.quantity,
        baseAmount: Number(i.baseAmount),
        lineTotalBeforeTax: Number(i.lineTotalBeforeTax),
        isTaxable: i.isTaxable,
        gstRate: Number(i.gstRate),
        planId: i.planId,
      })),
    };

    return NextResponse.json(
      {
        success: true,
        data: {
          invoice: responseInvoice,
        },
      },
      { status: 201 },
    );
  } catch (err: any) {
    console.error('POST /api/invoices error', err);

    if (err?.message === 'NO_BRANCH_CONFIGURED') {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'CONFIG_ERROR',
            message: 'No active branch configured in database',
          },
        },
        { status: 500 },
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: err?.message || 'Something went wrong',
        },
      },
      { status: 500 },
    );
  }
}
