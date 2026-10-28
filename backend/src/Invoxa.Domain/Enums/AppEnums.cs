namespace Invoxa.Domain.Enums;

public enum UserRole
{
    Admin = 1,
    Manager = 2,
    Staff = 3
}

public enum QuotationStatus
{
    Draft = 1,
    Sent = 2,
    Accepted = 3,
    Rejected = 4,
    Expired = 5
}

public enum InvoiceStatus
{
    Pending = 1,
    PartiallyPaid = 2,
    Paid = 3,
    Overdue = 4,
    Cancelled = 5
}

public enum PaymentMethod
{
    Cash = 1,
    BankTransfer = 2,
    BenefitPay = 3,
    CreditCard = 4,
    OnlinePayment = 5
}

public enum SubscriptionPlan
{
    Free = 1,
    Basic = 2,
    Professional = 3,
    Business = 4
}
