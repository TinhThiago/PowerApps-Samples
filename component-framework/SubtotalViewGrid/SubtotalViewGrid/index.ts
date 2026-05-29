import * as React from "react";
import { IInputs, IOutputs } from "./generated/ManifestTypes";
import { SubtotalGrid } from "./SubtotalGrid";

export class SubtotalViewGrid
  implements ComponentFramework.ReactControl<IInputs, IOutputs> {

  private context!: ComponentFramework.Context<IInputs>;

  public init(
    context: ComponentFramework.Context<IInputs>,
    notifyOutputChanged: () => void,
    state: ComponentFramework.Dictionary
  ): void {
    this.context = context;
    context.mode.trackContainerResize(true);
  }

  public updateView(
    context: ComponentFramework.Context<IInputs>
  ): React.ReactElement {
    this.context = context;

    return React.createElement(SubtotalGrid, {
      context,
      dataset: context.parameters.records
    });
  }

  public getOutputs(): IOutputs {
    return {};
  }

  public destroy(): void {
    // Không cần cleanup thêm.
  }
}