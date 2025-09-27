import { ContractFunctionParameters } from "@hashgraph/sdk";

export class ContractFunctionParameterBuilder {
  private parameters: ContractFunctionParameters;

  constructor() {
    this.parameters = new ContractFunctionParameters();
  }

  addString(value: string): ContractFunctionParameterBuilder {
    this.parameters.addString(value);
    return this;
  }

  addUint256(value: string | number): ContractFunctionParameterBuilder {
    this.parameters.addUint256(value);
    return this;
  }

  addInt256(value: string | number): ContractFunctionParameterBuilder {
    this.parameters.addInt256(value);
    return this;
  }

  addBytes(value: Uint8Array): ContractFunctionParameterBuilder {
    this.parameters.addBytes(value);
    return this;
  }

  addBytes32(value: Uint8Array): ContractFunctionParameterBuilder {
    this.parameters.addBytes32(value);
    return this;
  }

  addBool(value: boolean): ContractFunctionParameterBuilder {
    this.parameters.addBool(value);
    return this;
  }

  addAddress(value: string): ContractFunctionParameterBuilder {
    this.parameters.addAddress(value);
    return this;
  }

  addUint8(value: number): ContractFunctionParameterBuilder {
    this.parameters.addUint8(value);
    return this;
  }

  addUint32(value: number): ContractFunctionParameterBuilder {
    this.parameters.addUint32(value);
    return this;
  }

  addUint64(value: string | number): ContractFunctionParameterBuilder {
    this.parameters.addUint64(value);
    return this;
  }

  addInt8(value: number): ContractFunctionParameterBuilder {
    this.parameters.addInt8(value);
    return this;
  }

  addInt32(value: number): ContractFunctionParameterBuilder {
    this.parameters.addInt32(value);
    return this;
  }

  addInt64(value: string | number): ContractFunctionParameterBuilder {
    this.parameters.addInt64(value);
    return this;
  }

  buildHAPIParams(): ContractFunctionParameters {
    return this.parameters;
  }
}