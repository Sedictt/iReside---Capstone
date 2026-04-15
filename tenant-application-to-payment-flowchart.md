# Tenant Application to Payment Flowchart (Detailed, Full Process)

This version expands the entire journey end-to-end, including all major decision points, retries, exception handling, and final outcomes.

```mermaid
flowchart TD
    %% =========================
    %% 1) APPLICATION INTAKE
    %% =========================
    S([Tenant starts application])
    A1[Select listing and preferred move-in date]
    D1{Listing still available?}
    X1([Stop: listing unavailable])

    A2[Create account or log in]
    D2{Identity verified (email or phone OTP)?}
    A3[Retry OTP]
    D3{OTP retries exceeded?}
    X2([Stop: account locked for verification review])

    A4[Fill full application form]
    A5[Upload required documents<br/>Government ID, proof of income, references]
    D4{All required fields and files complete?}
    A6[Show validation errors and missing requirements]

    A7[Submit application]
    A8[System creates application record<br/>status = submitted]
    D5{Duplicate active application found?}
    A9[Merge or flag duplicate for manual check]
    D6{Fraud or risk signal triggered?}
    A10[Route to manual compliance review]
    D7{Compliance cleared?}
    X3([Stop: rejected by compliance])

    %% =========================
    %% 2) LANDLORD SCREENING
    %% =========================
    B1[Landlord pre-screens profile]
    D8{Meets minimum rental criteria?}
    X4([Rejected: criteria not met])

    B2[Run background and credit checks]
    D9{Background check pass?}
    X5([Rejected: background check failed])
    D10{Credit check pass?}
    B3[Request guarantor or larger deposit]
    D11{Conditional terms accepted by tenant?}
    X6([Rejected: conditional terms declined])

    B4[Verify employment and income]
    D12{Income-to-rent ratio sufficient?}
    B5[Request additional proof of income]
    D13{Additional proof provided by deadline?}
    X7([Rejected: missing income documents])
    D14{Manual override approved by landlord?}
    X8([Rejected: affordability not approved])

    B6[Landlord final decision]
    D15{Approved?}
    X9([Rejected: landlord decision])

    %% =========================
    %% 3) RESERVATION + INITIAL PAYMENTS
    %% =========================
    C1[Generate approval offer]
    C2[Define payment requirements<br/>reservation fee, security deposit, advance rent]
    D16{Reservation fee required?}
    C3[Create reservation invoice with deadline]
    D17{Reservation paid before deadline?}
    X10([Offer expired: unit released to market])

    C4[Create initial move-in invoice bundle]
    D18{All initial charges due in one payment?}
    C5[Enable installment schedule per policy]
    D19{Installment plan approved?}
    X11([Offer canceled: payment terms not agreed])

    C6[Send payment link and reminders]
    D20{Tenant starts payment before deadline?}
    X12([Pending timeout: automated reminders then offer expiry])

    C7[Choose payment channel<br/>GCash, Maya, card, bank transfer, cash deposit]
    C8[Payment gateway processing]
    D21{Gateway response}
    C9[Mark payment success]
    C10[Mark payment failed]
    C11[Mark payment pending reconciliation]
    C12[Mark payment canceled by tenant]
    D22{Retry allowed and within deadline?}
    X13([Failed: payment window closed])

    D23{Partial payment allowed?}
    C13[Record partial payment and remaining balance]
    D24{Remaining balance settled before deadline?}
    X14([Failed: incomplete initial payment by deadline])

    C14[Generate official receipt]
    C15[Notify landlord and tenant]
    D25{All required initial payments completed?}
    X15([Hold: waiting for outstanding initial charges])

    %% =========================
    %% 4) LEASE PREP + SIGNING
    %% =========================
    L1[Generate lease draft from approved terms]
    L2[Populate dates, rent amount, utilities, rules, penalties]
    D26{Lease draft approved by both parties?}
    L3[Edit terms and regenerate draft]

    D27{Signing mode}
    L4[Remote e-sign flow]
    L5[In-person signing flow]

    %% Remote signing detail
    L6[Send secure sign link to tenant]
    D28{Tenant signed before signing deadline?}
    L7[Send reminder sequence and extension option]
    D29{Extension granted?}
    X16([Canceled: tenant did not sign])
    L8[Send signed copy to landlord]
    D30{Landlord countersigned before deadline?}
    X17([Canceled: landlord did not countersign])

    %% In-person signing detail
    L9[Schedule signing appointment]
    D31{Both parties attended?}
    L10[Reschedule appointment]
    D32{Reschedule limit exceeded?}
    X18([Canceled: repeated no-show])
    L11[Capture signatures and witness info]

    D33{Any party declines final signature?}
    X19([Canceled: signature declined])

    L12[Finalize fully signed lease]
    L13[Set lease status = active]
    L14[Create move-in checklist and handover schedule]

    %% =========================
    %% 5) MOVE-IN + RECURRING BILLING
    %% =========================
    R1[Generate monthly rent invoice cycle]
    R2[Set due date, grace period, and penalties]
    D34{Auto-pay enabled?}
    R3[Run auto-pay on due date]
    D35{Auto-pay successful?}
    R4[Create manual payment task]

    R5[Tenant chooses payment method]
    R6[Submit payment or upload offline proof]
    D36{Payment verified by gateway or landlord?}
    R7[Mark invoice paid]
    R8[Request correction or resubmission]
    D37{Resubmitted before grace period ends?}
    R9[Apply late fee]
    D38{Still unpaid after late fee date?}

    R10[Send overdue notice level 1]
    D39{Unpaid after N days threshold?}
    R11[Send overdue notice level 2 + final warning]
    D40{Payment plan offered by landlord?}
    D41{Payment plan accepted by tenant?}
    R12[Track installment schedule]
    D42{Any installment missed?}
    R13[Default payment plan and escalate]

    D43{Unpaid after legal threshold?}
    R14[Start legal or eviction workflow per policy]
    X20([Lease at risk: legal escalation])

    %% =========================
    %% 6) UTILITIES BRANCH (PARALLEL EACH BILLING CYCLE)
    %% =========================
    U1[Utility billing cycle starts]
    D44{Utilities included in rent?}
    U2[No separate utility invoice]
    U3[Collect meter readings or provider bill]
    D45{Reading available on time?}
    U4[Use estimated consumption and flag adjustment]
    U5[Generate utility invoice]
    D46{Tenant disputes utility charge?}
    U6[Open dispute review]
    D47{Dispute approved?}
    U7[Adjust bill and reissue invoice]
    U8[Keep original bill]
    U9[Tenant pays utility invoice]
    D48{Utility payment verified?}
    U10[Mark utility bill paid]
    U11[Send utility overdue reminders and penalties]

    %% =========================
    %% 7) STEADY STATE / END STATES
    %% =========================
    E1([Active lease in good standing])
    E2([Delinquency resolved and account current])
    E3([Application rejected or canceled])
    E4([Lease terminated due to non-payment or cancellation])

    %% Primary flow connections
    S --> A1 --> D1
    D1 -->|No| X1
    D1 -->|Yes| A2 --> D2
    D2 -->|No| A3 --> D3
    D3 -->|Yes| X2
    D3 -->|No| D2
    D2 -->|Yes| A4 --> A5 --> D4
    D4 -->|No| A6 --> A4
    D4 -->|Yes| A7 --> A8 --> D5
    D5 -->|Yes| A9 --> D6
    D5 -->|No| D6
    D6 -->|Yes| A10 --> D7
    D7 -->|No| X3
    D7 -->|Yes| B1
    D6 -->|No| B1

    B1 --> D8
    D8 -->|No| X4
    D8 -->|Yes| B2 --> D9
    D9 -->|No| X5
    D9 -->|Yes| D10
    D10 -->|No| B3 --> D11
    D11 -->|No| X6
    D11 -->|Yes| B4
    D10 -->|Yes| B4
    B4 --> D12
    D12 -->|Yes| B6
    D12 -->|No| B5 --> D13
    D13 -->|No| X7
    D13 -->|Yes| D14
    D14 -->|No| X8
    D14 -->|Yes| B6
    B6 --> D15
    D15 -->|No| X9
    D15 -->|Yes| C1 --> C2 --> D16

    D16 -->|Yes| C3 --> D17
    D17 -->|No| X10
    D17 -->|Yes| C4
    D16 -->|No| C4

    C4 --> D18
    D18 -->|No| C5 --> D19
    D19 -->|No| X11
    D19 -->|Yes| C6
    D18 -->|Yes| C6

    C6 --> D20
    D20 -->|No| X12
    D20 -->|Yes| C7 --> C8 --> D21
    D21 -->|Success| C9 --> D23
    D21 -->|Failed| C10 --> D22
    D21 -->|Pending| C11 --> D22
    D21 -->|Canceled| C12 --> D22
    D22 -->|Yes| C7
    D22 -->|No| X13

    D23 -->|Yes| C13 --> D24
    D24 -->|No| X14
    D24 -->|Yes| C14
    D23 -->|No| C14

    C14 --> C15 --> D25
    D25 -->|No| X15
    D25 -->|Yes| L1 --> L2 --> D26
    D26 -->|No| L3 --> L1
    D26 -->|Yes| D27

    D27 -->|Remote| L4 --> L6 --> D28
    D28 -->|No| L7 --> D29
    D29 -->|Yes| L6
    D29 -->|No| X16
    D28 -->|Yes| L8 --> D30
    D30 -->|No| X17
    D30 -->|Yes| D33

    D27 -->|In-person| L5 --> L9 --> D31
    D31 -->|No| L10 --> D32
    D32 -->|Yes| X18
    D32 -->|No| L9
    D31 -->|Yes| L11 --> D33

    D33 -->|Yes| X19
    D33 -->|No| L12 --> L13 --> L14 --> R1

    R1 --> R2 --> D34
    D34 -->|Yes| R3 --> D35
    D35 -->|Yes| R7
    D35 -->|No| R4
    D34 -->|No| R4
    R4 --> R5 --> R6 --> D36
    D36 -->|Yes| R7
    D36 -->|No| R8 --> D37
    D37 -->|Yes| R6
    D37 -->|No| R9 --> D38

    R7 --> E1
    E1 --> R1

    D38 -->|No| E2
    D38 -->|Yes| R10 --> D39
    D39 -->|No| E2
    D39 -->|Yes| R11 --> D40
    D40 -->|No| D43
    D40 -->|Yes| D41
    D41 -->|No| D43
    D41 -->|Yes| R12 --> D42
    D42 -->|No| E2
    D42 -->|Yes| R13 --> D43
    D43 -->|No| E2
    D43 -->|Yes| R14 --> X20 --> E4

    %% Utility parallel branch (runs every billing cycle while lease is active)
    L13 --> U1 --> D44
    D44 -->|Yes| U2 --> E1
    D44 -->|No| U3 --> D45
    D45 -->|Yes| U5
    D45 -->|No| U4 --> U5
    U5 --> D46
    D46 -->|Yes| U6 --> D47
    D47 -->|Yes| U7 --> U9
    D47 -->|No| U8 --> U9
    D46 -->|No| U9
    U9 --> D48
    D48 -->|Yes| U10 --> E1
    D48 -->|No| U11 --> D39

    %% Rejection/cancel end-state mapping
    X1 --> E3
    X2 --> E3
    X3 --> E3
    X4 --> E3
    X5 --> E3
    X6 --> E3
    X7 --> E3
    X8 --> E3
    X9 --> E3
    X10 --> E3
    X11 --> E3
    X12 --> E3
    X13 --> E3
    X14 --> E3
    X15 --> E3
    X16 --> E3
    X17 --> E3
    X18 --> E3
    X19 --> E3

    %% Styles
    classDef process fill:#e0f2fe,stroke:#0c4a6e,stroke-width:1.5px;
    classDef decision fill:#fef3c7,stroke:#92400e,stroke-width:1.5px;
    classDef end fill:#fee2e2,stroke:#991b1b,stroke-width:1.5px;
    classDef good fill:#dcfce7,stroke:#166534,stroke-width:1.5px;

    class A1,A2,A3,A4,A5,A6,A7,A8,A9,A10,B1,B2,B3,B4,B5,B6,C1,C2,C3,C4,C5,C6,C7,C8,C9,C10,C11,C12,C13,C14,C15,L1,L2,L3,L4,L5,L6,L7,L8,L9,L10,L11,L12,L13,L14,R1,R2,R3,R4,R5,R6,R7,R8,R9,R10,R11,R12,R13,R14,U1,U2,U3,U4,U5,U6,U7,U8,U9,U10,U11 process;
    class D1,D2,D3,D4,D5,D6,D7,D8,D9,D10,D11,D12,D13,D14,D15,D16,D17,D18,D19,D20,D21,D22,D23,D24,D25,D26,D27,D28,D29,D30,D31,D32,D33,D34,D35,D36,D37,D38,D39,D40,D41,D42,D43,D44,D45,D46,D47,D48 decision;
    class X1,X2,X3,X4,X5,X6,X7,X8,X9,X10,X11,X12,X13,X14,X15,X16,X17,X18,X19,X20,E3,E4 end;
    class S,E1,E2 good;
```

## Notes for Use
- This flow is intentionally exhaustive for process mapping and review workshops.
- You can hide branches (for example, compliance or disputes) later if you need a simplified presentation copy.
