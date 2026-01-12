import { bold, cyan } from "@std/fmt/colors";

type InputOptions = {
    required?: boolean;
    validate?: (value: string) => string | null;
};

export async function promptInput(
    label: string,
    defaultValue = "",
    opts: InputOptions = {},
): Promise<string> {
    while (true) {
        const v = prompt(`${bold(label)}${defaultValue ? ` (${defaultValue})` : ""}:`) ??
            "";
        const value = v.trim() === "" ? defaultValue : v;

        if (opts.required && !value.trim()) {
            console.log("This value is required.");
            continue;
        }

        if (opts.validate) {
            const err = opts.validate(value);
            if (err) {
                console.log(err);
                continue;
            }
        }

        return value;
    }
}

type Choice<T> = {
    label: string;
    value: T;
};

export async function promptSelect<T>(
    label: string,
    choices: Choice<T>[],
): Promise<T> {
    console.log(bold(label));
    console.log(cyan("Use ↑ ↓ and Enter\n"));

    Deno.stdin.setRaw(true, { cbreak: true });

    let index = 0;
    const encoder = new TextEncoder();

    const render = () => {
        // Clear previous lines
        Deno.stdout.writeSync(encoder.encode(`\x1b[${choices.length}A`));
        Deno.stdout.writeSync(encoder.encode(`\x1b[J`));

        for (let i = 0; i < choices.length; i++) {
            const isActive = i === index;
            const prefix = isActive ? ">" : " ";
            console.log(`${prefix} ${choices[i].label}`);
        }
    };

    // Initial render
    for (let i = 0; i < choices.length; i++) {
        console.log(`  ${choices[i].label}`);
    }
    index = 0;
    render();

    const buffer = new Uint8Array(8);

    try {
        while (true) {
            const n = await Deno.stdin.read(buffer);
            if (!n) continue;

            const key = buffer.slice(0, n);

            // Enter key
            if (key[0] === 13) break;

            // Arrow keys (ESC [ A/B)
            if (key[0] === 27 && key[1] === 91) {
                if (key[2] === 65) { // Up
                    index = index > 0 ? index - 1 : choices.length - 1;
                } else if (key[2] === 66) { // Down
                    index = index < choices.length - 1 ? index + 1 : 0;
                }
                render();
            }

            // Ctrl+C
            if (key[0] === 3) {
                Deno.exit(0);
            }
        }
    } finally {
        Deno.stdin.setRaw(false);
    }

    console.log("");
    return choices[index].value;
}
