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