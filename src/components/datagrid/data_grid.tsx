import React, {
  FunctionComponent,
  HTMLAttributes,
  KeyboardEvent,
  useCallback,
  useState,
  useEffect,
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
import { keyCodes } from '../../services';
// @ts-ignore-next-line
import { EuiButtonEmpty } from '../button';
import { EuiDataGridBody } from './data_grid_body';
import { useColumnSelector } from './column_selector';
import { useStyleSelector } from './style_selector';
// @ts-ignore-next-line
import { EuiTablePagination } from '../table/table_pagination';
// @ts-ignore-next-line
import { EuiFocusTrap } from '../focus_trap';
import { EuiResizeObserver } from '../observer/resize_observer';

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
    <EuiTablePagination
      activePage={pageIndex}
      itemsPerPage={pageSize}
      itemsPerPageOptions={pageSizeOptions}
      pageCount={pageCount}
      onChangePage={onChangePage}
      onChangeItemsPerPage={onChangeItemsPerPage}
    />
  );
}

export const EuiDataGrid: FunctionComponent<EuiDataGridProps> = props => {
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [showGridControls, setShowGridControls] = useState(true);
  const [focusedCell, setFocusedCell] = useState<[number, number]>(ORIGIN);
  const [columnWidths, setColumnWidths] = useState<EuiDataGridColumnWidths>({});
  const setColumnWidth = (columnId: string, width: number) => {
    setColumnWidths({ ...columnWidths, [columnId]: width });
  };

  // This sets the original column widths to fill their container
  // Additionally it hides the controls when the container is too small
  const onResize = ({ width }: { width: number }) => {
    const initialColumnWidths = Math.max(width / props.columns.length, 100);
    const columnWidths = props.columns.reduce<EuiDataGridColumnWidths>(
      (columnWidths: EuiDataGridColumnWidths, column) => {
        columnWidths[column.id] = initialColumnWidths;
        return columnWidths;
      },
      {}
    );
    setColumnWidths(columnWidths);
    setShowGridControls(width > 480);
  };

  const onCellFocus = useCallback(
    (x: number, y: number) => {
      setFocusedCell([x, y]);
    },
    [setFocusedCell]
  );

  // Using ESCAPE exists the full screen grid
  const handleGridKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    switch (e.keyCode) {
      case keyCodes.ESCAPE:
        e.preventDefault();
        setIsFullScreen(false);
        break;
    }
  };

  const handleGridCellsKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const colCount = props.columns.length - 1;
    const [x, y] = focusedCell;
    const rowCount = computeVisibleRows(props);

    switch (e.keyCode) {
      case keyCodes.DOWN:
        e.preventDefault();
        if (y < rowCount) {
          setFocusedCell([x, y + 1]);
        }
        break;
      case keyCodes.LEFT:
        e.preventDefault();
        if (x > 0) {
          setFocusedCell([x - 1, y]);
        }
        break;
      case keyCodes.UP:
        e.preventDefault();
        // TODO sort out when a user can arrow up into the column headers
        if (y > 0) {
          setFocusedCell([x, y - 1]);
        }
        break;
      case keyCodes.RIGHT:
        e.preventDefault();
        if (x < colCount) {
          setFocusedCell([x + 1, y]);
        }
        break;
    }
  };

  const {
    columns,
    rowCount,
    renderCellValue,
    className,
    gridStyle,
    pagination,
    ...rest
  } = props;

  const [ColumnSelector, visibleColumns] = useColumnSelector(columns);
  const [StyleSelector, gridStyles, setGridStyles] = useStyleSelector(
    gridStyle
  );

  useEffect(() => {
    if (gridStyle) {
      setGridStyles(gridStyle);
    }
  }, [gridStyle]);

  const classes = classNames(
    'euiDataGrid',
    fontSizesToClassMap[gridStyles.fontSize || 'm'],
    bordersToClassMap[gridStyles.border || 'all'],
    headerToClassMap[gridStyles.header || 'shade'],
    rowHoverToClassMap[gridStyles.rowHover || 'highlight'],
    cellPaddingsToClassMap[gridStyles.cellPadding || 'm'],
    {
      'euiDataGrid--stripes': gridStyles.stripes || false,
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

  return (
    <EuiFocusTrap disabled={!isFullScreen} style={{ height: '100%' }}>
      <div className={classes} onKeyDown={handleGridKeyDown}>
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
              onKeyDown={handleGridCellsKeyDown}
              ref={resizeRef}
              className="euiDataGrid__verticalScroll"
              // {...label}
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
                  />
                </div>
              </div>
            </div>
          )}
        </EuiResizeObserver>

        <div className="euiDataGrid__pagination">{renderPagination(props)}</div>
      </div>
    </EuiFocusTrap>
  );
};
