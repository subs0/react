import React, {
    createElement,
    createContext,
    useContext,
    useState,
    useEffect,
    useLayoutEffect,
    useMemo,
} from "react"

import { Button } from "antd"

import "./App.less"

import { getIn } from "@thi.ng/paths"
import { isObject } from "@thi.ng/checks"
import { EquivMap } from "@thi.ng/associative"
import { Cursor } from "@thi.ng/atom"

//import "regenerator-runtime"
// import scrolly from "@mapbox/scroll-restorer"
// scrolly.start()

import { registerCMD, command$, out$, run$ } from "@-0/spool"
import {
    INJECT_HEAD,
    HURL,
    $store$,
    HURLer,
    DOMnavigated$,
    set$$tate,
    registerRouterDOM,
} from "@-0/browser"
import { parse, trace$, diff_keys } from "@-0/utils"
import * as K from "@-0/keys"

// ⚠ <=> API SURFACE AREA TOO LARGE <=> ⚠ .
// import { button_x } from "./components"
// import { THEME } from "./theme"

const log = console.log

//trace$("run$ ->", run$)
trace$("command$ ->", command$)
//trace$("out$ ->", out$)

const getSomeJSON = async (path, uid) => {
    const text_base = "https://jsonplaceholder.typicode.com/"
    const img_base = (id, sz) =>
        `http://lorempixel.com/${sz}/${sz}/sports/${id}/`

    const data = uid
        ? (async () => {
              let detail = await fetch(`${text_base}${path}/${uid}`).then(r =>
                  r.json()
              )
              let {
                  name = `User ${getIn(detail, ["id"])}`,
                  company: { catchPhrase } = { catchPhrase: detail.title },
              } = detail
              return {
                  [K.DOM.HEAD]: {
                      title: `${name}'s Details`,
                      description: `${name} handles ${catchPhrase}`,
                      image: { url: img_base(uid, 600) },
                  },
                  [K.DOM.BODY]: {
                      // lesson -> don't use the actual url as the uid (not flexible)
                      img: img_base(uid, 600),
                      // this needs fixin' 📌
                      text: detail,
                      uid,
                  },
              }
          })()
        : (async () => {
              let list = await fetch(`${text_base}${path}/`).then(r => r.json())
              return {
                  [K.DOM.HEAD]: {
                      title: `${path.replace(/^\w/, c =>
                          c.toUpperCase()
                      )} list`,
                      description: `List page for ${path}`,
                      image: { url: img_base(222, 200) },
                  },
                  [K.DOM_BODY]: list.map((c, i) => ({
                      img: img_base(i + 1, 200),
                      text: c,
                      uid: i + 1,
                  })),
              }
          })()
    return data
}
//
//                             d8
//  888-~\  e88~-_  888  888 _d88__  e88~~8e   d88~\
//  888    d888   i 888  888  888   d888  88b C888
//  888    8888   | 888  888  888   8888__888  Y88b
//  888    Y888   ' 888  888  888   Y888    ,   888D
//  888     "88_-~  "88_-888  "88_/  "88___/  \_88P
//
//

/**
 *
 * Even if you don't end up using `spule` - you may find the
 * [`@thi.ng/associative`](https://github.com/thi-ng/umbrella/tree/develop/packages/associative)
 * library __very handy__ indeed!
 *
 * Value semantics have so many benefits. As a router,
 * here's one.
 *
 * TODO: Graphql Example
 */
const routerCfg = async url => {
    let match = parse(url)
    // let {
    // URL,
    // URL_subdomain, // array
    // URL_domain, // array
    // URL_query, // object
    // URL_hash, // string
    // URL_path // array
    // } = match

    let path = match[K.URL.PATH]
    let [, p_b] = path

    let RES = new EquivMap([
        [
            { ...match, [K.URL.PATH]: ["todos"] },
            {
                [K.URL.DATA]: () => getSomeJSON("todos"),
                [K.URL.PAGE]: "page-1",
            },
        ],
        [
            { ...match, [K.URL.PATH]: ["todos", p_b] },
            {
                [K.URL.DATA]: () => getSomeJSON("todos", p_b),
                [K.URL.PAGE]: "page-2",
            },
        ],
        [
            { ...match, [K.URL.PATH]: ["users"] },
            {
                [K.URL.DATA]: () => getSomeJSON("users"),
                [K.URL.PAGE]: "page-1",
            },
        ],
        [
            { ...match, [K.URL.PATH]: ["users", p_b] },
            {
                [K.URL.DATA]: () => getSomeJSON("users", p_b),
                [K.URL.PAGE]: "page-2",
            },
        ],
        // home page (empty path)
        [
            { ...match, [K.URL.PATH]: [] },
            {
                [K.URL.DATA]: () => (log("HOME"), getSomeJSON("users", 10)),
                [K.URL.PAGE]: "page-2",
            },
        ], // get match || 404 data
    ]).get(match) || {
        [K.URL.DATA]: () => getSomeJSON("users", 10),
        [K.URL.PAGE]: "page-2",
    }

    let data = RES[K.URL.DATA]
    let page = RES[K.URL.PAGE]

    return { [K.URL.DATA]: await data(), [K.URL.PAGE]: page }
}

const logger = registerCMD({
    sub$: "logger",
    args: ({ x }) => x,
    work: log,
})

const createCursor = atom => (path, uid = `${Date.now()}`) => {
    const [state, setState] = useState(null)
    const cursor = new Cursor(atom, path)
    cursor.addWatch(
        uid,
        (id, bfr, aft) => (log(`${id} cursor triggered`), setState(aft))
    )
    return [state, cursor]
}

const useCursor = createCursor($store$)

// default value ({ run$  }) is applied when no Provider is found in the inheritance tree of the component (orphans)
const CTX = createContext({
    run$,
    useCursor,
    $store$,
    parse,
})

//@ts-ignore
const Pre = ({ data }) => {
    const json = JSON.stringify(data, null, 2)
    //log("Pre, json:", json)
    return <pre>{json}</pre>
}

//
//                              d8                        d8
//   e88~~\  e88~-_  888-~88e _d88__  e88~~8e  Y88b  /  _d88__
//  d888    d888   i 888  888  888   d888  88b  Y88b/    888
//  8888    8888   | 888  888  888   8888__888   Y88b    888
//  Y888    Y888   ' 888  888  888   Y888    ,   /Y88b   888
//   "88__/  "88_-~  888  888  "88_/  "88___/   /  Y88b  "88_/
//
//

//prettier-ignore
const Provider = ({ children, CFG = {} }) => {
   
    //const DOMRoot     = CFG[K.CFG_ROOT] || document.body 
    // ⬆ ⚠ can't refer to the root node (circular reference)

    // default wrapper for pages before they are specified
    const DefaultView = CFG[K.CFG_VIEW] || Pre
    const router      = CFG[K.CFG_RUTR]
    // clean URL
    const knowns      = Object.values(K.CFG) || []
    const prfx        = router[K.ROUTER_PRFX] || null
    const [, others]  = diff_keys(knowns, CFG)
    const escRGX      = /[-/\\^$*+?.()|[\]{}]/g
    const escaped     = str => str.replace(escRGX, "\\$&")
    const RGX         = prfx ? new RegExp(escaped(prfx || ""), "g") : null

    if (router) registerRouterDOM(router)
    else throw new Error(`no \`${K.CFG_RUTR}\` found in Provider CFG`)
    
    // Prime store with CFG state
    $store$.swap(x => ({...CFG, ...x}))
    //log("$store$.deref():", $store$.deref() )

    return (
        <CTX.Provider value={{
            run$,
            useCursor,
            $store$,
            parse: () => parse(window.location.href, RGX),
            DefaultView,
            ...others
          }}>
            { children }
        </CTX.Provider>
    )
}

const View = () => {
    const { useCursor, $store$, DefaultView } = useContext(CTX)
    const [Page, pageCursor] = useCursor([K.$$_VIEW], "View Page")
    const [loading, loadingCursor] = useCursor([K.$$_LOAD], "View loading")

    //layouteffect needed due to async shit...
    useLayoutEffect(() => {
        // re-render when loading state changes
        //log("re-rendered Page:", Page)
        // cleanup
        return () => {
            //log("cleaning up pageCursor and loadingCursor")
            pageCursor.release()
            loadingCursor.release()
        }
    }, [loading, loadingCursor, Page, pageCursor])

    const store = $store$.deref()

    const RenderPage =
        {
            "page-1": Page1,
            "page-2": Page2,
        }[Page] || DefaultView

    return <RenderPage data={store} />
}

const LogButton = () => {
    const { useCursor, $store$ } = useContext(CTX)

    const [count, countCursor] = useCursor(["count"], "LogButton count")

    const increment = crs => () => crs.swap(num => num + 1)
    const decrement = crs => () => crs.swap(num => num - 1)

    const store = $store$.deref()
    const num = getIn(store, ["count"])
    const src = getIn(store, ["img"])

    useEffect(() => {
        //log("cleaning up countCursor")
        return () => {
            countCursor.release()
        }
    }, [count, countCursor])

    return (
        <>
            <img {...{ src, alt: "sport" }} />
            <br />
            <Button type='primary' onClick={increment(countCursor)}>
                inc {num}
            </Button>
            <br />
        </>
    )
}

const Link = ({ to, children }) => {
    const { run$ } = useContext(CTX)
    const path = `/${to}`
    log({ path })
    return (
        <a
            href={path}
            onClick={e => {
                e.preventDefault()
                run$.next({ ...HURL, args: e })
            }}
        >
            {children}
        </a>
    )
}

const h = createElement

const Page1 = ({ data }) => {
    return h(
        "pre",
        { className: "ass" },
        h("h1", null, `PAGE 1:`),
        h(LogButton),
        JSON.stringify(data, null, 2)
    )
}

const Page2 = ({ data }) => {
    return h(
        "pre",
        { className: "boobs" },
        h("h1", null, `PAGE 2:`),
        JSON.stringify(data, null, 2)
    )
}

//export const root = document.getElementById("root")

const App = () => {
    return (
        // @ts-ignore
        <Provider
            CFG={{
                count: 0,
                [K.CFG_RUTR]: routerCfg /* circular dep!! [K.CFG_ROOT]: root*/,
            }}
        >
            <Link to='users'>users</Link>
            <br />
            <Link to='users/1'>users/1</Link>
            <br />
            <View />
        </Provider>
    )
}

log("registered Commands:", out$.topics.entries())

log("starting...")

export default App
