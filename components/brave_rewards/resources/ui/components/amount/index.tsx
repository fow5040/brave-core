/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as React from 'react'
import { StyledWrapper, StyledAmount, StyledNumber, StyledLogo, StyledConverted, StyledTokens } from './style'
import { getLocale } from 'brave-ui/helpers'
import { BatColorIcon } from 'brave-ui/components/icons'

export interface Props {
  amount: string
  converted: string
  onSelect: (amount: string) => void
  id?: string
  selected?: boolean
  type?: 'big' | 'small'
  currency?: string
  onlyAnonWallet?: boolean
}

export default class Amount extends React.PureComponent<Props, {}> {
  private selectedAmount: HTMLDivElement | null

  static defaultProps = {
    type: 'small',
    currency: 'USD',
    converted: 0
  }

  constructor (props: Props) {
    super(props)
    this.selectedAmount = null
  }

  componentDidMount () {
    if (this.selectedAmount) {
      this.selectedAmount.click()
    }
  }

  selectedNodeRef = (node: HTMLDivElement) => {
    const { selected } = this.props

    if (selected) {
      this.selectedAmount = node
    }
  }

  getAboutText = (isMobile?: boolean) => {
    return isMobile ? '' : getLocale('about')
  }

  getBatString = () => {
    const { onlyAnonWallet, type } = this.props

    if (type !== 'big') {
      return null
    }

    return getLocale(onlyAnonWallet ? 'bap' : 'bat')
  }

  render () {
    const { id, onSelect, amount, selected, type, converted, currency } = this.props

    return (
      <StyledWrapper
        id={id}
        onClick={onSelect.bind(this, amount)}
        data-test-id={'amount-wrapper'}
        innerRef={this.selectedNodeRef}
      >
        <StyledAmount selected={selected} type={type}>
          <StyledLogo><BatColorIcon /></StyledLogo><StyledNumber>{amount}</StyledNumber> <StyledTokens>{this.getBatString()}</StyledTokens>
        </StyledAmount>
        <StyledConverted selected={selected} type={type}>
          {getLocale('about')} {converted} {currency}
        </StyledConverted>
      </StyledWrapper>
    )
  }
}
