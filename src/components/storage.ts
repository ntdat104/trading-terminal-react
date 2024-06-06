type UpdateRequest = {
  symbol: string;
  value: any;
};

class Storage {
  private symbols: Record<string, any> = {};

  constructor() {}

  public updateSymbol(updateRequest: UpdateRequest) {
    const { symbol, value } = updateRequest;
    this.symbols[symbol] = {
      ...this.symbols[symbol],
      ...value,
      k: {
        ...this.symbols[symbol]?.k,
        ...value?.k,
        c: value?.c || this.symbols[symbol]?.k?.c,
      },
    };
  }

  public getAllSymbol() {
    return this.symbols;
  }

  public getSymbol(symbol: string) {
    return this.symbols[symbol];
  }
}

export default Storage;
