/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as React from 'react'
import { DragDropContext } from 'react-dnd'
import HTML5Backend from 'react-dnd-html5-backend'
import {
  Page,
  Header,
  ClockWidget as Clock,
  ListWidget as List,
  Footer,
  App,
  PosterBackground,
  Gradient,
  RewardsWidget as Rewards
} from '../../components/default'

// Components
import Stats from './stats'
import Block from './block'
import FooterInfo from './footerInfo'
import SiteRemovalNotification from './notification'

interface Props {
  newTabData: NewTab.State
  actions: any
  saveShowBackgroundImage: (value: boolean) => void
  saveShowClock: (value: boolean) => void
  saveShowTopSites: (value: boolean) => void
  saveShowStats: (value: boolean) => void
  saveShowRewards: (value: boolean) => void
}

interface State {
  onlyAnonWallet: boolean
  showSettingsMenu: boolean
  backgroundHasLoaded: boolean
}

function GetBackgroundImageSrc (props: Props) {
  if (!props.newTabData.showBackgroundImage) {
    return undefined
  }
  if (props.newTabData.shouldShowBrandedWallpaper) {
    const wallpaperData = props.newTabData.brandedWallpaperData
    if (wallpaperData && wallpaperData.wallpaperImageUrl) {
      return wallpaperData.wallpaperImageUrl
    }
  }
  if (props.newTabData.backgroundImage && props.newTabData.backgroundImage.source) {
    return props.newTabData.backgroundImage.source
  }
  return undefined
}

class NewTabPage extends React.Component<Props, State> {
  state = {
    onlyAnonWallet: false,
    showSettingsMenu: false,
    backgroundHasLoaded: false
  }

  imageSource?: string = undefined

  componentDidMount () {
    // if a notification is open at component mounting time, close it
    this.props.actions.onHideSiteRemovalNotification()
    this.imageSource = GetBackgroundImageSrc(this.props)
    this.trackCachedImage()
  }

  componentDidUpdate (prevProps: Props) {
    const oldImageSource = GetBackgroundImageSrc(prevProps)
    const newImageSource = GetBackgroundImageSrc(this.props)
    this.imageSource = newImageSource
    if (newImageSource && oldImageSource !== newImageSource) {
      this.trackCachedImage()
    }
    if (oldImageSource &&
      !newImageSource) {
      // reset loaded state
      this.setState({ backgroundHasLoaded: false })
    }
  }

  trackCachedImage () {
    if (this.imageSource) {
      const imgCache = new Image()
      imgCache.src = this.imageSource
      console.timeStamp('image start loading...')
      imgCache.onload = () => {
        console.timeStamp('image loaded')
        this.setState({
          backgroundHasLoaded: true
        })
      }
    }
  }

  onDraggedSite = (fromUrl: string, toUrl: string, dragRight: boolean) => {
    this.props.actions.siteDragged(fromUrl, toUrl, dragRight)
  }

  onDragEnd = (url: string, didDrop: boolean) => {
    this.props.actions.siteDragEnd(url, didDrop)
  }

  onToggleBookmark (site: NewTab.Site) {
    if (site.bookmarked === undefined) {
      this.props.actions.bookmarkAdded(site.url)
    } else {
      this.props.actions.bookmarkRemoved(site.url)
    }
  }

  onTogglePinnedTopSite (site: NewTab.Site) {
    if (!site.pinned) {
      this.props.actions.sitePinned(site.url)
    } else {
      this.props.actions.siteUnpinned(site.url)
    }
  }

  onIgnoredTopSite (site: NewTab.Site) {
    this.props.actions.siteIgnored(site.url)
  }

  toggleShowBackgroundImage = () => {
    this.props.saveShowBackgroundImage(
      !this.props.newTabData.showBackgroundImage
    )
  }

  toggleShowClock = () => {
    this.props.saveShowClock(
      !this.props.newTabData.showClock
    )
  }

  toggleShowStats = () => {
    this.props.saveShowStats(
      !this.props.newTabData.showStats
    )
  }

  toggleShowTopSites = () => {
    this.props.saveShowTopSites(
      !this.props.newTabData.showTopSites
    )
  }

  toggleShowRewards = () => {
    this.props.saveShowRewards(
      !this.props.newTabData.showRewards
    )
  }

  enableAds = () => {
    chrome.braveRewards.saveAdsSetting('adsEnabled', 'true')
  }

  enableRewards = () => {
    this.props.actions.onRewardsSettingSave('enabledMain', '1')
  }

  createWallet = () => {
    this.props.actions.createWallet()
  }

  dismissNotification = (id: string) => {
    this.props.actions.dismissNotification(id)
  }

  closeSettings = () => {
    this.setState({ showSettingsMenu: false })
  }

  toggleSettings = () => {
    this.setState({ showSettingsMenu: !this.state.showSettingsMenu })
  }

  render () {
    const { newTabData, actions } = this.props
    const { showSettingsMenu } = this.state
    const { rewardsState } = newTabData

    if (!newTabData) {
      return null
    }

    const hasImage = this.imageSource !== null

    return (
      <App dataIsReady={newTabData.initialDataLoaded}>
        <PosterBackground
          hasImage={hasImage}
          imageHasLoaded={this.state.backgroundHasLoaded}
        >
          {hasImage &&
            <img src={this.imageSource} />
          }
        </PosterBackground>
        {hasImage &&
          <Gradient
            imageHasLoaded={this.state.backgroundHasLoaded}
          />
        }
        <Page>
          <Header>
            <Stats
              textDirection={newTabData.textDirection}
              stats={newTabData.stats}
              showWidget={newTabData.showStats}
              hideWidget={this.toggleShowStats}
              menuPosition={'right'}
            />
            <Clock
              textDirection={newTabData.textDirection}
              showWidget={newTabData.showClock}
              hideWidget={this.toggleShowClock}
              menuPosition={'left'}
            />
            <Rewards
              {...rewardsState}
              onCreateWallet={this.createWallet}
              onEnableAds={this.enableAds}
              onEnableRewards={this.enableRewards}
              textDirection={newTabData.textDirection}
              showWidget={newTabData.showRewards}
              hideWidget={this.toggleShowRewards}
              onDismissNotification={this.dismissNotification}
              menuPosition={'left'}
            />
            {this.props.newTabData.gridSites.length ? <List
              blockNumber={this.props.newTabData.gridSites.length}
              textDirection={newTabData.textDirection}
              showWidget={newTabData.showTopSites}
              menuPosition={'right'}
              hideWidget={this.toggleShowTopSites}
            >
              {
                this.props.newTabData.gridSites.map((site: NewTab.Site) =>
                  <Block
                    key={site.url}
                    id={site.url}
                    title={site.title}
                    href={site.url}
                    favicon={site.favicon}
                    style={{ backgroundColor: site.themeColor || site.computedThemeColor }}
                    onToggleBookmark={this.onToggleBookmark.bind(this, site)}
                    onPinnedTopSite={this.onTogglePinnedTopSite.bind(this, site)}
                    onIgnoredTopSite={this.onIgnoredTopSite.bind(this, site)}
                    onDraggedSite={this.onDraggedSite}
                    onDragEnd={this.onDragEnd}
                    isPinned={site.pinned}
                    isBookmarked={site.bookmarked !== undefined}
                  />
                )
              }
            </List> : null}
            {
              this.props.newTabData.showSiteRemovalNotification
              ? <SiteRemovalNotification actions={actions} />
              : null
            }
          </Header>
          <Footer>
            <FooterInfo
              textDirection={newTabData.textDirection}
              onClickOutside={this.closeSettings}
              backgroundImageInfo={newTabData.backgroundImage}
              onClickSettings={this.toggleSettings}
              showSettingsMenu={showSettingsMenu}
              showPhotoInfo={newTabData.showBackgroundImage}
              toggleShowBackgroundImage={this.toggleShowBackgroundImage}
              toggleShowClock={this.toggleShowClock}
              toggleShowStats={this.toggleShowStats}
              toggleShowTopSites={this.toggleShowTopSites}
              showBackgroundImage={newTabData.showBackgroundImage}
              showClock={newTabData.showClock}
              showStats={newTabData.showStats}
              showTopSites={newTabData.showTopSites}
              showRewards={newTabData.showRewards}
              toggleShowRewards={this.toggleShowRewards}
            />
          </Footer>
        </Page>
      </App>
    )
  }
}

export default DragDropContext(HTML5Backend)(NewTabPage)
