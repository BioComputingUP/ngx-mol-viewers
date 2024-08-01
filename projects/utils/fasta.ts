import { Parser } from './parser';

export type Sequence = { sequence: string, label: string };

class FastaParser extends Parser<Sequence[]> {

  public override parseText(text: string): Sequence[] {
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

export const FASTA = new FastaParser();