import React, { useState } from 'react';

import {
  EuiButton,
  EuiButtonIcon,
  EuiSpacer,
  EuiTitle,
} from '../../../../src/components';

export default () => {
  const [toggle0On, setToggle0On] = useState(false);
  const [toggle1On, setToggle1On] = useState(false);
  const [toggle2On, setToggle2On] = useState(true);
  const [toggle3On, setToggle3On] = useState(false);

  return (
    <>
      <EuiTitle size="xxs">
        <h3>Changing content</h3>
      </EuiTitle>
      <EuiSpacer size="s" />
      <EuiButton
        fill={toggle1On}
        onClick={() => {
          setToggle1On(!toggle1On);
        }}>
        {toggle1On ? 'I am a filled toggle' : 'I am a primary toggle'}
      </EuiButton>
      &emsp;
      <EuiButtonIcon
        title={toggle2On ? 'Play' : 'Pause'}
        aria-label={toggle2On ? 'Play' : 'Pause'}
        iconType={toggle2On ? 'play' : 'pause'}
        onClick={() => {
          setToggle2On(!toggle2On);
        }}
      />
      <EuiSpacer size="m" />
      <EuiTitle size="xxs">
        <h3>Changing visual appearance</h3>
      </EuiTitle>
      <EuiSpacer size="s" />
      <EuiButton
        fill={toggle0On}
        aria-pressed={toggle0On}
        iconType={toggle0On ? 'starPlusEmpty' : 'starFilledSpace'}
        onClick={() => {
          setToggle0On(!toggle0On);
        }}>
        Toggle me
      </EuiButton>
      &emsp;
      <EuiButtonIcon
        aria-label="Autosave"
        title="Autosave"
        iconType="save"
        aria-pressed={toggle3On}
        color={toggle3On ? 'primary' : 'subdued'}
        onClick={() => {
          setToggle3On(!toggle3On);
        }}
      />
    </>
  );
};
