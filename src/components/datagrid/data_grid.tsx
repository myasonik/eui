import React, {
  FunctionComponent,
  HTMLAttributes,
  KeyboardEvent,
  useCallback,
  useState,
  useEffect,
  useRef,
  Fragment,
} from 'react';
import classNames from 'classnames';
import { EuiDataGridHeaderRow } from './data_grid_header_row';
import { CommonProps, Omit } from '../common';
import {
  EuiDataGridColumn,
  EuiDataGridColumnWidths,
  EuiDataGridPaginationProps,
  EuiDataGridStyle,
  EuiDataGridStyleBorders,
  EuiDataGridStyleCellPaddings,
  EuiDataGridStyleFontSizes,
  EuiDataGridStyleHeader,
  EuiDataGridStyleRowHover,
} from './data_grid_types';
import { EuiDataGridCellProps } from './data_grid_cell';
// @ts-ignore-next-line
import { EuiButtonEmpty } from '../button';
import { keyCodes, htmlIdGenerator } from '../../services';
import { EuiDataGridBody } from './data_grid_body';
import { useColumnSelector } from './column_selector';
import { useStyleSelector, startingStyles } from './style_selector';
// @ts-ignore-next-line
import { EuiTablePagination } from '../table/table_pagination';
// @ts-ignore-next-line
import { EuiFocusTrap } from '../focus_trap';
import { EuiResizeObserver } from '../observer/resize_observer';
import { CELL_CONTENTS_ATTR } from './utils';

type CommonGridProps = CommonProps &
  HTMLAttributes<HTMLDivElement> & {
    columns: EuiDataGridColumn[];
    rowCount: number;
    renderCellValue: EuiDataGridCellProps['renderCellValue'];
    gridStyle?: EuiDataGridStyle;
    pagination?: EuiDataGridPaginationProps;
  };

// This structure forces either aria-label or aria-labelledby to be defined
// making some type of label a requirement
type EuiDataGridProps = Omit<CommonGridProps, 'aria-label'> &
  ({ 'aria-label': string } | { 'aria-labelledby': string });

// Each gridStyle object above sets a specific CSS select to .euiGrid
const fontSizesToClassMap: { [size in EuiDataGridStyleFontSizes]: string } = {
  s: 'euiDataGrid--fontSizeSmall',
  m: '',
  l: 'euiDataGrid--fontSizeLarge',
};

const headerToClassMap: { [header in EuiDataGridStyleHeader]: string } = {
  shade: 'euiDataGrid--headerShade',
  underline: 'euiDataGrid--headerUnderline',
};

const rowHoverToClassMap: {
  [rowHighlight in EuiDataGridStyleRowHover]: string
} = {
  highlight: 'euiDataGrid--rowHoverHighlight',
  none: '',
};

const bordersToClassMap: { [border in EuiDataGridStyleBorders]: string } = {
  all: 'euiDataGrid--bordersAll',
  horizontal: 'euiDataGrid--bordersHorizontal',
  none: 'euiDataGrid--bordersNone',
};

const cellPaddingsToClassMap: {
  [cellPaddings in EuiDataGridStyleCellPaddings]: string
} = {
  s: 'euiDataGrid--paddingSmall',
  m: '',
  l: 'euiDataGrid--paddingLarge',
};
const ORIGIN: [number, number] = [0, 0];

function computeVisibleRows(props: EuiDataGridProps) {
  const { pagination, rowCount } = props;

  const startRow = pagination ? pagination.pageIndex * pagination.pageSize : 0;
  let endRow = pagination
    ? (pagination.pageIndex + 1) * pagination.pageSize
    : rowCount;
  endRow = Math.min(endRow, rowCount);

  return endRow - startRow;
}

function renderPagination(props: EuiDataGridProps) {
  const { pagination } = props;

  if (pagination == null) {
    return null;
  }

  const {
    pageIndex,
    pageSize,
    pageSizeOptions,
    onChangePage,
    onChangeItemsPerPage,
  } = pagination;
  const pageCount = Math.ceil(props.rowCount / pageSize);

  return (
    <div className="euiDataGrid__pagination">
      <EuiTablePagination
        activePage={pageIndex}
        itemsPerPage={pageSize}
        itemsPerPageOptions={pageSizeOptions}
        pageCount={pageCount}
        onChangePage={onChangePage}
        onChangeItemsPerPage={onChangeItemsPerPage}
      />
    </div>
  );
}

export const EuiDataGrid: FunctionComponent<EuiDataGridProps> = props => {
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [showGridControls, setShowGridControls] = useState(true);
  const [focusedCell, setFocusedCell] = useState<[number, number]>(ORIGIN);
  const containerRef = useRef<HTMLDivElement>(null);
  const [interactiveCellId] = useState(htmlIdGenerator()());
  const [columnWidths, setColumnWidths] = useState<EuiDataGridColumnWidths>({});
  const setColumnWidth = (columnId: string, width: number) => {
    setColumnWidths({ ...columnWidths, [columnId]: width });
  };

  useEffect(() => {
    if (containerRef.current != null) {
      const gridWidth = containerRef.current.clientWidth;
      const columnWidth = Math.max(gridWidth / props.columns.length, 100);
      const columnWidths = props.columns.reduce(
        (columnWidths: EuiDataGridColumnWidths, column) => {
          columnWidths[column.id] = columnWidth;
          return columnWidths;
        },
        {}
      );
      setColumnWidths(columnWidths);
    }
  }, []);

  const onResize = ({ width }: { width: number }) => {
    setShowGridControls(width > 480);
  };

  const [isGridNavigationEnabled, setIsGridNavigationEnabled] = useState<
    boolean
  >(true);

  const isInteractiveCell = (element: HTMLElement) => {
    if (element.getAttribute('role') !== 'gridcell') {
      return false;
    }

    return Boolean(element.querySelector(`[${CELL_CONTENTS_ATTR}="true"]`));
  };

  const handleGridKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    switch (e.keyCode) {
      case keyCodes.ESCAPE:
        e.preventDefault();
        setIsFullScreen(false);
        break;
    }
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const colCount = props.columns.length - 1;
    const [x, y] = focusedCell;
    const rowCount = computeVisibleRows(props);
    const { keyCode, target } = event;

    if (
      target instanceof HTMLElement &&
      isInteractiveCell(target) &&
      isGridNavigationEnabled &&
      (keyCode === keyCodes.ENTER || keyCode === keyCodes.F2)
    ) {
      setIsGridNavigationEnabled(false);
    } else if (
      !isGridNavigationEnabled &&
      (keyCode === keyCodes.ESCAPE || keyCode === keyCodes.F2)
    ) {
      setIsGridNavigationEnabled(true);
    }

    if (isGridNavigationEnabled) {
      switch (keyCode) {
        case keyCodes.DOWN:
          if (y < rowCount) {
            event.preventDefault();
            setFocusedCell([x, y + 1]);
          }
          break;
        case keyCodes.LEFT:
          if (x > 0) {
            event.preventDefault();
            setFocusedCell([x - 1, y]);
          }
          break;
        case keyCodes.UP:
          // TODO sort out when a user can arrow up into the column headers
          if (y > 0) {
            event.preventDefault();
            setFocusedCell([x, y - 1]);
          }
          break;
        case keyCodes.RIGHT:
          if (x < colCount) {
            event.preventDefault();
            setFocusedCell([x + 1, y]);
          }
          break;
      }
    }
  };

  const {
    columns,
    rowCount,
    renderCellValue,
    className,
    gridStyle = startingStyles,
    pagination,
    ...rest
  } = props;

  const [ColumnSelector, visibleColumns] = useColumnSelector(columns);
  const [StyleSelector, gridStyles, setGridStyles] = useStyleSelector();

  useEffect(() => {
    if (gridStyle) {
      const oldStyles = gridStyles;
      /*eslint-disable */
      const mergedStyle = Object.assign(
        /*eslint-enable */
        {},
        oldStyles,
        // @ts-ignore
        gridStyle
      );
      setGridStyles(mergedStyle);
    } else {
      setGridStyles(startingStyles);
    }
  }, [gridStyle]);

  const classes = classNames(
    'euiDataGrid',
    fontSizesToClassMap[gridStyles.fontSize!],
    bordersToClassMap[gridStyles.border!],
    headerToClassMap[gridStyles.header!],
    rowHoverToClassMap[gridStyles.rowHover!],
    cellPaddingsToClassMap[gridStyles.cellPadding!],
    {
      'euiDataGrid--stripes': gridStyles.stripes!,
    },
    {
      'euiDataGrid--fullScreen': isFullScreen,
    },
    className
  );

  // These grid controls will only show when there is room. Check the resize observer callback
  const gridControls = (
    <Fragment>
      <ColumnSelector />
      <StyleSelector />
    </Fragment>
  );

  // When data grid is full screen, we add a class to the body to remove the extra scrollbar
  if (isFullScreen) {
    document.body.classList.add('euiDataGrid__restrictBody');
  } else {
    document.body.classList.remove('euiDataGrid__restrictBody');
  }

  const onCellFocus = useCallback(setFocusedCell, [setFocusedCell]);

  return (
    <EuiFocusTrap disabled={!isFullScreen} style={{ height: '100%' }}>
      <div className={classes} onKeyDown={handleGridKeyDown} ref={containerRef}>
        <div className="euiDataGrid__controls">
          {showGridControls ? gridControls : null}
          <EuiButtonEmpty
            size="xs"
            iconType="fullScreen"
            color="text"
            className={isFullScreen ? 'euiDataGrid__controlBtn--active' : null}
            onClick={() => setIsFullScreen(!isFullScreen)}
            onKeyDown={handleGridKeyDown}>
            {isFullScreen ? 'Exit full screen' : 'Full screen'}
          </EuiButtonEmpty>
        </div>
        {/* Unsure why this element causes errors as focus follows spec */}
        {/* eslint-disable jsx-a11y/interactive-supports-focus */}
        <EuiResizeObserver onResize={onResize}>
          {resizeRef => (
            <div
              role="grid"
              onKeyDown={handleKeyDown}
              className="euiDataGrid__verticalScroll"
              ref={resizeRef}
              {...rest}>
              <div className="euiDataGrid__overflow">
                <div className="euiDataGrid__content">
                  <EuiDataGridHeaderRow
                    columns={visibleColumns}
                    columnWidths={columnWidths}
                    setColumnWidth={setColumnWidth}
                  />
                  <EuiDataGridBody
                    columnWidths={columnWidths}
                    columns={visibleColumns}
                    focusedCell={focusedCell}
                    onCellFocus={onCellFocus}
                    pagination={pagination}
                    renderCellValue={renderCellValue}
                    rowCount={rowCount}
                    isGridNavigationEnabled={isGridNavigationEnabled}
                    interactiveCellId={interactiveCellId}
                  />
                </div>
              </div>
            </div>
          )}
        </EuiResizeObserver>

        {renderPagination(props)}
        <p id={interactiveCellId} hidden>
          Cell contains interactive content.
          {/* TODO: if no keyboard shortcuts panel gets built, add keyboard shortcut info here */}
        </p>
      </div>
    </EuiFocusTrap>
  );
};
