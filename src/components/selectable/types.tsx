import React from 'react';
import { CommonProps } from '../common';

export type OptionCheckedType = 'on' | 'off' | undefined;

export interface Option extends CommonProps {
  /**
   * Visible label of option. Must be unique across items if `key` is not supplied
   */
  label: string;
  /**
   * Must be unique across items
   */
  key?: string;
  /**
   * Leave off to indicate not selected,
   * 'on' to indicate inclusion and
   * 'off' to indicate exclusion
   */
  checked?: OptionCheckedType;
  disabled?: boolean;
  /**
   * Set to true to indicate object is just a grouping label, not a selectable item
   */
  isGroupLabel?: boolean;
  /**
   * Node to add between the selection icon and the label
   */
  prepend?: React.ReactNode;
  /**
   * Node to add to the far right of the item
   */
  append?: React.ReactNode;
  ref?: (optionIndex: number) => void;
}
