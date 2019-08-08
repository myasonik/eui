import React, {
  Component,
  FunctionComponent,
  JSXElementConstructor,
  memo,
  ReactNode,
  createRef,
  Fragment,
} from 'react';
import { Omit } from '../common';
import tabbable from 'tabbable';
import { EuiPortal } from '../portal';
import { htmlIdGenerator } from '../..//services';

interface CellValueElementProps {
  rowIndex: number;
  columnName: string;
}

export interface EuiDataGridCellProps {
  rowIndex: number;
  colIndex: number;
  columnName: string;
  width: number;
  isFocusable: boolean;
  onCellFocus: Function;
  renderCellValue:
    | JSXElementConstructor<CellValueElementProps>
    | ((props: CellValueElementProps) => ReactNode);
}

interface EuiDataGridCellState {
  tabbables: HTMLElement[];
  nodes: NodeListOf<ChildNode>;
}

type EuiDataGridCellValueProps = Omit<EuiDataGridCellProps, 'width'>;

const EuiDataGridCellContent: FunctionComponent<
  EuiDataGridCellValueProps
> = memo(props => {
  const { renderCellValue, ...rest } = props;

  // React is more permissable than the TS types indicate
  const CellElement = renderCellValue as JSXElementConstructor<
    CellValueElementProps
  >;

  return <CellElement {...rest} />;
});

export class EuiDataGridCell extends Component<
  EuiDataGridCellProps,
  EuiDataGridCellState
> {
  cellRef = createRef<HTMLDivElement>();
  state = {
    tabbables: [] as HTMLElement[],
    nodes: document.createDocumentFragment().childNodes,
  };

  idMaker = htmlIdGenerator();

  setTabbablesTabIndex() {
    this.state.tabbables.forEach(element => {
      element.setAttribute('tabIndex', this.props.isFocusable ? '0' : '-1');
    });
  }

  updateFocus() {
    if (this.cellRef.current && this.props.isFocusable) {
      const { tabbables, nodes } = this.state;

      if (tabbables.length === 1 && nodes.length === 1) {
        tabbables[0].focus();
      } else {
        this.cellRef.current.focus();
      }
    }
  }

  componentDidMount() {
    if (this.cellRef.current) {
      // eslint-disable-next-line react/no-did-mount-set-state
      this.setState(
        {
          tabbables: tabbable(this.cellRef.current),
          nodes: this.cellRef.current.childNodes,
        },
        this.setTabbablesTabIndex
      );
    }
  }

  componentDidUpdate(prevProps: EuiDataGridCellProps) {
    if (prevProps.isFocusable !== this.props.isFocusable) {
      this.setTabbablesTabIndex();
      this.updateFocus();
    }
  }

  render() {
    const { tabbables, nodes } = this.state;
    const { width, ...rest } = this.props;
    const { colIndex, rowIndex, onCellFocus, isFocusable } = rest;

    const isInteractiveCell =
      tabbables.length > 1 || (tabbables.length === 1 && nodes.length > 1);
    const shouldCellRecieveFocus = isFocusable && !isInteractiveCell;
    const interactiveCellId = isInteractiveCell ? this.idMaker() : undefined;

    return (
      <Fragment>
        <div
          role="gridcell"
          aria-describedby={interactiveCellId}
          tabIndex={shouldCellRecieveFocus ? 0 : -1}
          ref={this.cellRef}
          className="euiDataGridRowCell"
          data-test-subj="dataGridRowCell"
          onFocus={() => onCellFocus(colIndex, rowIndex)}
          style={{ width: `${width}px` }}>
          <EuiDataGridCellContent {...rest} />
        </div>
        {isInteractiveCell && (
          <EuiPortal>
            <p id={interactiveCellId} hidden>
              Cell contains interactive content.
            </p>
          </EuiPortal>
        )}
      </Fragment>
    );
  }
}
