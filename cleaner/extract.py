import re
import random

UNIQUE_DELIMITER = "[NEW_MESSAGE_HERE] "
MAX_MESSAGE_LENGTH = 19000  # split limit

GROUP_MESSAGE = (
    "\nFor more Novels like this join us on Novels Republic Channel Today\n\n"
    "https://whatsapp.com/channel/0029VaALswPCRs1qNr0IJW2e\n"
)

REPLACEMENTS = [
    # (re.compile(r"kwaku ome", re.IGNORECASE), "Novels Republic"),
    (re.compile(r"Coolval", re.IGNORECASE), "Novels Republic"),
    (re.compile(r"kwaku", re.IGNORECASE), "Novels Republic"),
    (re.compile(r"zero eight zero three six nine five six four seven one", re.IGNORECASE), "+2348055889183"),
    (re.compile(r"hi phoenix", re.IGNORECASE), "hi NovelsRepublic"),
]

PHONE_REGEX = re.compile(r"(\+?(234|233)|0)?[-.\s]?\d{3}[-.\s]?\d{3}[-.\s]?\d{4}", re.IGNORECASE)
LINK_REGEX = re.compile(r"https?:\/\/\S+|www\.\S+", re.IGNORECASE)


def clean_and_random_insert(message: str) -> str:
    """Clean message content and randomly insert GROUP_MESSAGE (100% chance)."""
    message = PHONE_REGEX.sub("2348055889183", message)
    message = LINK_REGEX.sub("https://whatsapp.com/channel/0029VaALswPCRs1qNr0IJW2e", message)

    for pattern, repl in REPLACEMENTS:
        message = pattern.sub(repl, message)

    if random.random() < 0.4:
        lines = message.split("\n")
        if lines:
            insert_pos = random.randint(0, len(lines))
            lines.insert(insert_pos, GROUP_MESSAGE)
            message = "\n".join(lines)

    return message


def split_long_message(message: str):
    """Split messages >19k chars on newline boundaries to keep chunks readable."""
    if len(message) <= MAX_MESSAGE_LENGTH:
        return [message]

    parts = []
    lines = message.split("\n")
    current_chunk = ""

    for line in lines:
        if len(current_chunk) + len(line) + 1 > MAX_MESSAGE_LENGTH:
            parts.append(current_chunk.rstrip())
            current_chunk = line + "\n"
        else:
            current_chunk += line + "\n"

    if current_chunk.strip():
        parts.append(current_chunk.rstrip())

    return parts


def extract_whatsapp_messages(input_file, output_file):
    message_pattern = re.compile(r"^\d{1,2}/\d{1,2}/\d{2,4}, \d{1,2}:\d{2} - (.*?): (.*)")
    message_counter = 0
    current_message = []
    has_message_started = False

    with open(input_file, 'r', encoding='utf-8') as infile, open(output_file, 'w', encoding='utf-8') as outfile:
        for line in infile:
            line = line.rstrip('\n')
            # if not line.strip():
            #     continue

            match = message_pattern.match(line)
            if match:
                if has_message_started and current_message:
                    full_message = "\n".join(current_message)
                    full_message = clean_and_random_insert(full_message)

                    for part in split_long_message(full_message):
                        message_counter += 1
                        outfile.write(f"[{message_counter}] {part}\n\n")

                    current_message = []

                has_message_started = True
                _, message = match.groups()
                message = message.replace('"', "'")
                current_message.append(message)
            else:
                if has_message_started:
                    line = line.replace('"', "'")
                    current_message.append(line)

        if has_message_started and current_message:
            full_message = "\n".join(current_message)
            full_message = clean_and_random_insert(full_message)
            for part in split_long_message(full_message):
                message_counter += 1
                outfile.write(f"[{message_counter}] {part}\n\n")

    print(f"✅ Extraction complete. Total messages saved (including splits): {message_counter}")


if __name__ == "__main__":
    input_path = "whatsapp_chat.txt"
    output_path = "../cleaned_messages.txt"
    extract_whatsapp_messages(input_path, output_path)
