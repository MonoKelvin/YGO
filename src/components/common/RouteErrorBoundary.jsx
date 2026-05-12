import { Component } from 'react'

import { Button } from '@lobehub/ui'

import './RouteErrorBoundary.css'



/**

 * 捕获子树渲染错误，避免整页白屏（尤其对 Markdown / 路由页）。

 */

export default class RouteErrorBoundary extends Component {

  constructor(props) {

    super(props)

    this.state = { error: null }

  }



  static getDerivedStateFromError(error) {

    return { error }

  }



  componentDidCatch(error, info) {

    console.error('[RouteErrorBoundary]', error, info?.componentStack)

  }



  render() {

    const { children, title = '该页面暂时无法显示' } = this.props

    const { error } = this.state



    if (error) {

      return (

        <div className="route-error-boundary">

          <p className="route-error-boundary-title">{title}</p>

          <p className="route-error-boundary-detail">

            {error?.message || String(error)}

          </p>

          <Button

            color="primary"

            variant="outlined"

            onClick={() => this.setState({ error: null })}

          >

            重试

          </Button>

        </div>

      )

    }



    return children

  }

}


