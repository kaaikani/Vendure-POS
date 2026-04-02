export interface IQuery<TResult, TVariables = void> {
  execute(variables: TVariables): Promise<TResult>;
}
