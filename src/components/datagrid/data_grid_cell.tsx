import React, {
  Component,
  FunctionComponent,
  JSXElementConstructor,
  memo,
  ReactNode,
  createRef,
} from 'react';
import { Omit } from '../common';
import tabbable from 'tabbable';
import { EuiPortal } from '../portal';
import { htmlIdGenerator } from '../../services';
// @ts-ignore
import { EuiFocusTrap } from '../focus_trap';

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
  isGridNavigationEnabled: boolean;
  isInteractiveCell: Function;
  renderCellValue:
    | JSXElementConstructor<CellValueElementProps>
    | ((props: CellValueElementProps) => ReactNode);
}

interface EuiDataGridCellState {
  tabbables: HTMLElement[];
  nodes: NodeListOf<ChildNode>;
  isInteractiveCell: boolean;
}

type EuiDataGridCellValueProps = Omit<
  EuiDataGridCellProps,
  'width' | 'isGridNavigationEnabled' | 'isFocusable'
>;

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
    isInteractiveCell: false,
  };

  idMaker = htmlIdGenerator();

  setTabbablesTabIndex() {
    const { isFocusable, isGridNavigationEnabled } = this.props;
    const areContentsFocusable = isFocusable && !isGridNavigationEnabled;

    this.state.tabbables.forEach(element => {
      element.setAttribute('tabIndex', areContentsFocusable ? '0' : '-1');
    });
  }

  updateFocus() {
    const { isFocusable, isGridNavigationEnabled } = this.props;
    if (this.cellRef.current && isFocusable) {
      const { tabbables, nodes } = this.state;

      if (isGridNavigationEnabled) {
        if (tabbables.length === 1 && nodes.length === 1) {
          tabbables[0].focus();
        } else {
          this.cellRef.current.focus();
        }
      } else {
        tabbables[0].focus();
      }
    }
  }

  componentDidMount() {
    const { current: currentNode } = this.cellRef;

    if (currentNode) {
      // eslint-disable-next-line react/no-did-mount-set-state
      this.setState(
        {
          tabbables: tabbable(currentNode),
          // @ts-ignore // TODO is this too hacky? yes. use new ref.
          nodes: currentNode.querySelector('[data-focus-lock-disabled]')
            .childNodes,
        },
        () => {
          const { tabbables, nodes } = this.state;
          const isInteractiveCell =
            tabbables.length > 1 ||
            (tabbables.length === 1 && nodes.length > 1);

          this.setTabbablesTabIndex();
          this.props.isInteractiveCell(isInteractiveCell);
          this.setState({ isInteractiveCell });
        }
      );
    }
  }

  componentDidUpdate(prevProps: EuiDataGridCellProps) {
    const didFocusChange = prevProps.isFocusable !== this.props.isFocusable;
    const didNavigationChange =
      prevProps.isGridNavigationEnabled !== this.props.isGridNavigationEnabled;

    if (didFocusChange || didNavigationChange) {
      this.setTabbablesTabIndex();
      this.updateFocus();
    }
  }

  render() {
    const { isInteractiveCell } = this.state;
    const { width, isGridNavigationEnabled, isFocusable, ...rest } = this.props;
    const { colIndex, rowIndex, onCellFocus } = rest;

    const shouldCellRecieveFocus = isFocusable && !isInteractiveCell;
    const interactiveCellId = isInteractiveCell ? this.idMaker() : undefined;

    return (
      <>
        <div
          role="gridcell"
          aria-describedby={interactiveCellId}
          tabIndex={shouldCellRecieveFocus ? 0 : -1}
          ref={this.cellRef}
          className="euiDataGridRowCell"
          data-test-subj="dataGridRowCell"
          onFocus={() => onCellFocus(colIndex, rowIndex)}
          style={{ width: `${width}px` }}>
          <EuiFocusTrap disabled={isGridNavigationEnabled}>
            <div ref={this.cellContentsRef}>
              <EuiDataGridCellContent {...rest} />
            </div>
          </EuiFocusTrap>
        </div>
        {isInteractiveCell && (
          // TODO:
          // Q: This this worth doing this here to be co-located & not have to pass an ID around
          // at the cost of rendering tons of these?
          <EuiPortal>
            <p id={interactiveCellId} hidden>
              Cell contains interactive content.
            </p>
          </EuiPortal>
        )}
      </>
    );
  }
}
