export function startSpinner(text: string) {
    const frames = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];
    let i = 0;
    const timer = setInterval(() => {
        const frame = frames[i++ % frames.length];
        Deno.stdout.writeSync(new TextEncoder().encode(`\r${frame} ${text}`));
    }, 80);

    return {
        stop(success: boolean) {
            clearInterval(timer);
            const icon = success ? "✅" : "❌";
            Deno.stdout.writeSync(new TextEncoder().encode(`\r${icon} ${text}\n`));
        },
    };
}
