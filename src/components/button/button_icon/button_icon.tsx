import React, {
  AnchorHTMLAttributes,
  ButtonHTMLAttributes,
  FunctionComponent,
  Ref,
  ReactNode,
} from 'react';
import classNames from 'classnames';
import { EuiScreenReaderOnly } from '../../accessibility/screen_reader';
import { getSecureRelForTarget } from '../../../services';
import {
  CommonProps,
  ExclusiveUnion,
  PropsForAnchor,
  PropsForButton,
  keysOf,
} from '../../common';

import { IconType, IconSize, EuiIcon } from '../../icon';

import { ButtonSize } from '../button';

export type EuiButtonIconColor =
  | 'danger'
  | 'disabled'
  | 'ghost'
  | 'primary'
  | 'subdued'
  | 'success'
  | 'text'
  | 'warning';

export type EuiButtonIconProps = {
  iconType?: IconType;
  color?: EuiButtonIconColor;
  isDisabled?: boolean;
  size?: ButtonSize;
  iconSize?: IconSize;
} & CommonProps &
  ExclusiveUnion<
    { 'aria-hidden': true },
    ExclusiveUnion<{ label: ReactNode }, { 'aria-labelledby': string }>
  >;

type EuiButtonIconPropsForAnchor = PropsForAnchor<
  EuiButtonIconProps,
  {
    buttonRef?: Ref<HTMLAnchorElement>;
  }
>;

export type EuiButtonIconPropsForButton = PropsForButton<
  EuiButtonIconProps,
  {
    buttonRef?: Ref<HTMLButtonElement>;
  }
>;

type Props = ExclusiveUnion<
  EuiButtonIconPropsForAnchor,
  EuiButtonIconPropsForButton
>;

const colorToClassNameMap: { [color in EuiButtonIconColor]: string } = {
  danger: 'euiButtonIcon--danger',
  disabled: 'euiButtonIcon--disabled',
  ghost: 'euiButtonIcon--ghost',
  primary: 'euiButtonIcon--primary',
  subdued: 'euiButtonIcon--subdued',
  success: 'euiButtonIcon--success',
  text: 'euiButtonIcon--text',
  warning: 'euiButtonIcon--warning',
};

export const COLORS = keysOf(colorToClassNameMap);

export const EuiButtonIcon: FunctionComponent<Props> = ({
  className,
  iconType,
  iconSize = 'm',
  color = 'primary',
  isDisabled,
  href,
  type = 'button',
  target,
  rel,
  buttonRef,
  label,
  ...rest
}) => {
  const tabIndex = rest['aria-hidden'] === true ? -1 : undefined;
  const classes = classNames(
    'euiButtonIcon',
    colorToClassNameMap[color],
    className
  );

  // Add an icon to the button if one exists.
  let buttonIcon;

  if (iconType) {
    buttonIcon = (
      <EuiIcon
        className="euiButtonIcon__icon"
        type={iconType}
        size={iconSize}
        aria-hidden="true"
      />
    );
  }

  // <a> elements don't respect the `disabled` attribute. So if we're disabled, we'll just pretend
  // this is a button and piggyback off its disabled styles.
  if (href && !isDisabled) {
    const secureRel = getSecureRelForTarget({ href, target, rel });

    return (
      <a
        tabIndex={tabIndex}
        className={classes}
        href={href}
        target={target}
        rel={secureRel}
        ref={buttonRef as Ref<HTMLAnchorElement>}
        {...rest as AnchorHTMLAttributes<HTMLAnchorElement>}>
        {buttonIcon}
        {label && (
          <EuiScreenReaderOnly>
            <span>{label}</span>
          </EuiScreenReaderOnly>
        )}
      </a>
    );
  }

  let buttonType: ButtonHTMLAttributes<HTMLButtonElement>['type'];
  return (
    <button
      tabIndex={tabIndex}
      disabled={isDisabled}
      className={classes}
      type={type as typeof buttonType}
      ref={buttonRef as Ref<HTMLButtonElement>}
      {...rest as ButtonHTMLAttributes<HTMLButtonElement>}>
      {buttonIcon}
      {label && (
        <EuiScreenReaderOnly>
          <span>{label}</span>
        </EuiScreenReaderOnly>
      )}
    </button>
  );
};
