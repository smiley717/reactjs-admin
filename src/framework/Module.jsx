/**
 * In terms of design, this is the entry point for the framework and should not try to access anything else above this tree.
 */
import React from 'react'
import PropTypes from 'prop-types'
import {
    Router
} from 'react-router-dom'
import createBrowserHistory from 'history/createBrowserHistory'
import CSSTransitionGroup from 'react-transition-group/CSSTransitionGroup'

import Navbar from './Navbar'
import Modal from './Modal'
import SideNav from './SideNav'
import ContentSwitcher from './ContentSwitcher'

class Module extends React.Component {
    static propTypes = {
        /**
         * Module configuration
         */
        config: PropTypes.object.isRequired
    }

    constructor(props) {
        super(props)
        this.isPathActive = this.isPathActive.bind(this)
        this.toggleSideNav = this.toggleSideNav.bind(this)
        this.updateStatesBasedOnWindowSize = this.updateStatesBasedOnWindowSize.bind(this)
        this.handleClickOutsideSideNav = this.handleClickOutsideSideNav.bind(this)
        this.showModal = this.showModal.bind(this)
        this.dismissModal = this.dismissModal.bind(this)
        this.state = {
            activePath: [],
            smallDeviceNavigation: false,
            sideNavVisible: true
        }
    }

    componentWillMount() {
        this.pathToRoutes = this.determinePathToRoutesFromContent(this.props.config.content, [])
        this.history = createBrowserHistory({
            basename: ((typeof this.props.config.basename === "function") ? this.props.config.basename() : this.props.config.basename) || ""
        })

        this.updateStatesBasedOnWindowSize()
    }

    /**
     * When the side nav link is clicked and smallDeviceNavigation state is true then set the result to false otherwise set it to true.
     */
    componentDidMount() {
        this.setState({ activePath: this.pathToRoutes[location.pathname] })

        this.unlistenHistory = this.history.listen((location, action) => {
            if (action === "PUSH") {
                if (this.state.smallDeviceNavigation) {
                    console.log("HERE")
                    this.setState({ sideNavVisible: false })
                }
                const newActivePath = this.pathToRoutes[location.pathname]
                if (newActivePath === undefined) {
                    this.setState({ activePath: [] })
                } else {
                    this.setState({ activePath: newActivePath })
                }
            }
        })
        document.title = this.props.config.title
        window.addEventListener("resize", this.updateStatesBasedOnWindowSize)
        window.addEventListener("orientationchange", this.updateStatesBasedOnWindowSize)
    }

    componentWillUnmount() {
        this.unlistenHistory()
        window.removeEventListener("orientationchange", this.updateStatesBasedOnWindowSize)
        window.removeEventListener("resize", this.updateStatesBasedOnWindowSize)
    }

    handleClickOutsideSideNav() {
        if (this.state.smallDeviceNavigation) {
            this.setState({sideNavVisible: false})
        }
    }

    /**
     * This will trigger a state change based on the device size.
     */
    updateStatesBasedOnWindowSize() {
        const w = window,
            d = document,
            documentElement = d.documentElement,
            body = d.getElementsByTagName('body')[0],
            width = w.innerWidth || documentElement.clientWidth || body.clientWidth
        // height = w.innerHeight || documentElement.clientHeight || body.clientHeight
        if (width >= 576) {
            if (this.state.smallDeviceNavigation) {
                this.setState({ smallDeviceNavigation: false })
            }
            if (!this.state.sideNavVisible) {
                this.setState({ sideNavVisible: true })
            }
        } else {
            if (!this.state.smallDeviceNavigation) {
                // Force hide the side nav if the smallDeviceNavigation was false before.
                this.setState({ sideNavVisible: false })
            }
            if (!this.state.smallDeviceNavigation) {
                this.setState({ smallDeviceNavigation: true })
            }
        }
    }

    isPathActive(pathForLink) {
        if (this.state.activePath === undefined) {
            return false
        }
        for (let i = 0; i < pathForLink.length; ++i) {

            if (i >= this.state.activePath.length || this.state.activePath[i] != pathForLink[i]) {
                return false
            }
        }
        return true
    }
    /**
     * Toggles the side nav for smaller screens.
     */
    toggleSideNav() {
        this.setState(({ sideNavVisible }) => ({ sideNavVisible: !sideNavVisible }))
    }
    /**
     * Note this will be a function that builds a function.
     */
    showModal(title, bodyComponent, footerComponent) {
        return (event) => {
            this.setState({ modal: { title, bodyComponent, footerComponent } })
        }
    }
    dismissModal() {
        this.setState({ modal: null })
    }

    /**
     * This will recursively scan the content array to determine and activation paths
     * @param {MenuItem[]} content menu content array
     * @param {number[]} parentPath parent path
     * @returns {object} route path to activation path map
     */
    determinePathToRoutesFromContent(content, parentPath) {
        let routes = {}
        content.forEach((elem, i) => {
            let currentPath = parentPath.slice(0)
            currentPath.push(i)
            if (elem.content) {
                Object.assign(routes, this.determinePathToRoutesFromContent(elem.content, currentPath))
            }
            if (!elem.externalLink && elem.to && elem.component) {
                routes[elem.to] = currentPath
            }
        })
        return routes
    }

    render() {
        let modalComponents = []
        if (this.state.modal) {
            modalComponents.push(
                <Modal key="modal" title={this.state.modal.title} dismissModal={this.dismissModal} bodyComponent={this.state.modal.bodyComponent} />
            )
            modalComponents.push(
                <div key="backdrop" className="modal-backdrop fade show"></div>)
        }
        return <Router history={this.history}>
            <div>
                <Navbar title={this.props.config.title} smallDeviceNavigation={this.state.smallDeviceNavigation} logo={this.props.config.logo} toggleSideNav={this.toggleSideNav} />
                <div className="container-fluid">
                    <div className="row">
                        <SideNav key="sideNav" content={this.props.config.content} visible={this.state.sideNavVisible} isPathActive={this.isPathActive} onClickOutsideSideNav={this.handleClickOutsideSideNav} />
                        <ContentSwitcher key="content" content={this.props.config.content} sideNavVisible={this.state.sideNavVisible} notFoundComponent={this.props.config.notFoundComponent} showModal={this.showModal} />
                    </div>
                </div>
                {modalComponents}
            </div>
        </Router>
    }
}

export default Module
