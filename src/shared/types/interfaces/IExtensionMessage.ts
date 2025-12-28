import { MessageType } from '../enums';
import { IProductData } from './IProductData';
import { IAnalysisResult } from './IAnalysisResult';

interface IExtensionMessage {
  type: MessageType;
  payload?: unknown;
}

interface IAnalyzeMessage extends IExtensionMessage {
  type: MessageType.AnalyzeProduct;
  payload: IProductData;
}

interface IAnalysisResultMessage extends IExtensionMessage {
  type: MessageType.AnalysisResult;
  payload: IAnalysisResult;
}

interface IErrorMessage extends IExtensionMessage {
  type: MessageType.Error;
  payload: { message: string };
}

interface IGetProductDataMessage extends IExtensionMessage {
  type: MessageType.GetProductData;
}

type ExtensionMessageUnion =
  | IAnalyzeMessage
  | IAnalysisResultMessage
  | IErrorMessage
  | IGetProductDataMessage;

export type {
  IExtensionMessage,
  IAnalyzeMessage,
  IAnalysisResultMessage,
  IErrorMessage,
  IGetProductDataMessage,
  ExtensionMessageUnion,
};
