export abstract class Parser<T> {

  protected abstract parseText(text: string): T;

  protected parseFile(file: Blob): Promise<T> {
    // Cast input file to string
    const reader = new FileReader();
    // Read file as text
    reader.readAsText(file, 'utf-8');
    // Return promise
    return new Promise((resolve, reject) => {
      // Resolve promise with parsed text
      reader.onload = () => resolve(this.parseText('' + reader.result));
      // Reject promise with error
      reader.onerror = error => reject(error);
    });

  }

  public parse(input: string): T;
  public parse(input: Blob): Promise<T>;
  public parse(input: Blob | string): T | Promise<T> {
    // Case input is not a string
    if (typeof input !== 'string') {
      // Then parse file
      return this.parseFile(input);
    }
    // Otherwise, just parse text
    return this.parseText('' + input);
  }
}

export type Sequence = { sequence: string, label: string };

class FastaParser extends Parser<Sequence[]> {
  protected override parseText(text: string): Sequence[] {
    // Split line by newline character
    const lines = text.split(/[\n\r]+/);
    // Define output
    const parsed: { sequence: string, label: string }[] = [];
    // Define current index
    let index = -1;
    // Loop through each line
    for (let line of lines) {
      // Sanitize line
      line = line.trim();
      // In case line starts with '>' character, then define new sequence entry
      if (line.startsWith('>')) {
        // Define new sequence entry
        parsed.push({ sequence: '', label: line.slice(1) });
        // Update index
        index++
      }
      // In case index (0) has been defined beforehand, then current line is sequence
      else if (index > -1) parsed[index].sequence += line;
      // Otherwise, fine is not fasta formatted and an error is thrown
      else throw new Error('Provided text is not in fasta format');
    }
    // Return parsed sequences and labels
    return parsed;
  }
}

// Export single instance of fasta parser
export const FASTA = new FastaParser();
