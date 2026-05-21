import re

with open('src/app/landlord/utilities/page.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Wrapper
content = re.sub(
    r'className="flex min-h-full w-full flex-col bg-background text-foreground"',
    r'className="flex min-h-full w-full flex-col bg-[#E7E5E4] text-[#1E2938] font-mono"',
    content
)

# Hero Header
content = re.sub(
    r'className="relative overflow-hidden border-b border-border bg-card/20 px-6 py-10 md:px-12 md:py-16"',
    r'className="relative overflow-hidden px-6 py-10 md:px-12 md:py-16"',
    content
)

# Title
content = re.sub(
    r'className="text-5xl font-black tracking-tight text-foreground md:text-6xl lg:text-7xl">',
    r'className="text-5xl font-bold tracking-tight text-[#1E2938] md:text-6xl lg:text-7xl">',
    content
)
content = re.sub(
    r'<span className="text-primary">Facilities</span>',
    r'<span className="text-[#006666]">Facilities</span>',
    content
)

# Add Facility Button (Hero)
content = re.sub(
    r'className="flex items-center gap-3 rounded-2xl bg-primary px-8 py-4 text-sm font-black text-primary-foreground shadow-2xl shadow-primary/20 transition-all hover:bg-primary/90 hover:scale-\[1.05\] active:scale-95"',
    r'className="flex items-center gap-3 rounded-2xl bg-[#E7E5E4] px-8 py-4 text-sm font-bold text-[#006666] shadow-[8px_8px_16px_#c4c3c2,-8px_-8px_16px_#ffffff] transition-all hover:shadow-[inset_4px_4px_8px_#c4c3c2,inset_-4px_-4px_8px_#ffffff] active:shadow-[inset_6px_6px_12px_#c4c3c2,inset_-6px_-6px_12px_#ffffff]"',
    content
)

# Tabs Wrapper
content = re.sub(
    r'className="flex w-full items-center gap-2 rounded-3xl bg-muted/30 p-2 sm:w-fit border border-border/40 backdrop-blur-sm"',
    r'className="flex w-full items-center gap-2 rounded-3xl bg-[#E7E5E4] shadow-[inset_8px_8px_16px_#c4c3c2,inset_-8px_-8px_16px_#ffffff] p-2 sm:w-fit"',
    content
)

# Tab Active
content = re.sub(
    r'\? "bg-card text-foreground shadow-xl ring-1 ring-border/50"\s*: "text-muted-foreground hover:bg-muted/80 hover:text-foreground"',
    r'? "bg-[#E7E5E4] text-[#006666] shadow-[8px_8px_16px_#c4c3c2,-8px_-8px_16px_#ffffff]"\n                                        : "text-[#1E2938]/70 hover:text-[#1E2938]"',
    content
)

# Search Input
content = re.sub(
    r'className="w-full rounded-\[2rem\] border border-border bg-card py-4 pl-14 pr-6 text-base font-medium outline-none ring-primary/20 transition-all focus:border-primary/50 focus:ring-8 shadow-sm"',
    r'className="w-full rounded-[2rem] border-none bg-[#E7E5E4] py-4 pl-14 pr-6 text-base font-medium outline-none shadow-[inset_8px_8px_16px_#c4c3c2,inset_-8px_-8px_16px_#ffffff] transition-all text-[#1E2938]"',
    content
)

# Filter button
content = re.sub(
    r'className="flex size-14 items-center justify-center rounded-\[2rem\] border border-border bg-card text-muted-foreground transition-all hover:bg-muted hover:text-primary active:scale-90"',
    r'className="flex size-14 items-center justify-center rounded-[2rem] bg-[#E7E5E4] shadow-[8px_8px_16px_#c4c3c2,-8px_-8px_16px_#ffffff] text-[#1E2938] transition-all hover:shadow-[inset_4px_4px_8px_#c4c3c2,inset_-4px_-4px_8px_#ffffff] active:shadow-[inset_6px_6px_12px_#c4c3c2,inset_-6px_-6px_12px_#ffffff]"',
    content
)

# Add new facility big button
content = re.sub(
    r'className="group relative flex flex-col items-center justify-center gap-5 rounded-3xl border-2 border-dashed border-border/50 bg-muted/10 p-8 transition-all hover:bg-primary/\[0.03\] hover:border-primary/30 hover:shadow-lg min-h-\[340px\]"',
    r'className="group relative flex flex-col items-center justify-center gap-5 rounded-3xl bg-[#E7E5E4] shadow-[12px_12px_24px_#c4c3c2,-12px_-12px_24px_#ffffff] p-8 transition-all hover:shadow-[inset_8px_8px_16px_#c4c3c2,inset_-8px_-8px_16px_#ffffff] min-h-[340px]"',
    content
)

# Cards
content = re.sub(
    r'className="group relative flex flex-col overflow-hidden rounded-3xl border border-border bg-card shadow-sm transition-all duration-300 hover:shadow-\[0_18px_34px_-28px_rgba\(15,23,42,0.2\)\] hover:-translate-y-1 hover:border-primary/20"',
    r'className="group relative flex flex-col overflow-hidden rounded-3xl bg-[#E7E5E4] shadow-[12px_12px_24px_#c4c3c2,-12px_-12px_24px_#ffffff] transition-all duration-300 hover:shadow-[inset_8px_8px_16px_#c4c3c2,inset_-8px_-8px_16px_#ffffff]"',
    content
)

# Card inner type icon
content = re.sub(
    r'className="absolute bottom-4 left-4 z-20 flex size-11 items-center justify-center rounded-2xl bg-white text-primary border border-border shadow-xl dark:bg-card dark:text-primary"',
    r'className="absolute bottom-4 left-4 z-20 flex size-11 items-center justify-center rounded-2xl bg-[#E7E5E4] shadow-[4px_4px_8px_#c4c3c2,-4px_-4px_8px_#ffffff] text-[#006666]"',
    content
)

# Delete Button
content = re.sub(
    r'className="flex size-9 items-center justify-center rounded-xl border border-border text-muted-foreground transition-all hover:bg-red-500/10 hover:text-red-500"',
    r'className="flex size-9 items-center justify-center rounded-xl bg-[#E7E5E4] shadow-[4px_4px_8px_#c4c3c2,-4px_-4px_8px_#ffffff] text-[#FF2157] transition-all hover:shadow-[inset_2px_2px_4px_#c4c3c2,inset_-2px_-2px_4px_#ffffff]"',
    content
)

# Manage Button
content = re.sub(
    r'className="flex items-center gap-1.5 rounded-xl bg-foreground px-4 py-2 text-xs font-black text-background transition-all hover:bg-primary hover:text-primary-foreground hover:shadow-md hover:shadow-primary/20"',
    r'className="flex items-center gap-1.5 rounded-xl bg-[#E7E5E4] px-4 py-2 text-xs font-bold text-[#1E2938] shadow-[4px_4px_8px_#c4c3c2,-4px_-4px_8px_#ffffff] transition-all hover:shadow-[inset_2px_2px_4px_#c4c3c2,inset_-2px_-2px_4px_#ffffff]"',
    content
)

# Requests Table Wrapper
content = re.sub(
    r'className="rounded-\[3rem\] border border-border bg-card shadow-2xl overflow-hidden"',
    r'className="rounded-[3rem] bg-[#E7E5E4] shadow-[12px_12px_24px_#c4c3c2,-12px_-12px_24px_#ffffff] overflow-hidden"',
    content
)

# History wrapper
content = re.sub(
    r'className="flex flex-col items-center justify-center py-32 rounded-\[4rem\] border-4 border-dashed border-border/40 bg-muted/5"',
    r'className="flex flex-col items-center justify-center py-32 rounded-[4rem] bg-[#E7E5E4] shadow-[inset_12px_12px_24px_#c4c3c2,inset_-12px_-12px_24px_#ffffff]"',
    content
)

# Fix fonts
content = re.sub(r'font-black', r'font-bold', content)

with open('src/app/landlord/utilities/page.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
