import React, { createContext, useContext, useState, useReducer } from "react"
import { Button } from "antd"
import "./App.less"

import { getInUnsafe } from "@thi.ng/paths"
import { isObject } from "@thi.ng/checks"
import { EquivMap } from "@thi.ng/associative"
import { fromAtom } from "@thi.ng/rstream"
import { map } from "@thi.ng/transducers"
import { Cursor, Atom } from "@thi.ng/atom"

//import "regenerator-runtime"
// import scrolly from "@mapbox/scroll-restorer"
// scrolly.start()

// ⚠ <=> API SURFACE AREA TOO LARGE <=> ⚠ .
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
        `https://i.picsum.photos/id/${id}/${sz}/${sz}.jpg`

    const data = uid
        ? (async () => {
              let detail = await fetch(`${text_base}${path}/${uid}`).then(r =>
                  r.json()
              )
              let {
                  name = `User ${getInUnsafe(detail, "id")}`,
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
                  [K.DOM.BODY]: list.map((c, i) => ({
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
            { [K.URL.DATA]: () => getSomeJSON("todos"), [K.URL.PAGE]: page1 },
        ],
        [
            { ...match, [K.URL.PATH]: ["todos", p_b] },
            {
                [K.URL.DATA]: () => getSomeJSON("todos", p_b),
                [K.URL.PAGE]: page2,
            },
        ],
        [
            { ...match, [K.URL.PATH]: ["users"] },
            { [K.URL.DATA]: () => getSomeJSON("users"), [K.URL.PAGE]: page1 },
        ],
        [
            { ...match, [K.URL.PATH]: ["users", p_b] },
            {
                [K.URL.DATA]: () => getSomeJSON("users", p_b),
                [K.URL.PAGE]: page2,
            },
        ],
        // home page (empty path)
        [
            { ...match, [K.URL.PATH]: [] },
            {
                [K.URL.DATA]: () => (
                    console.log("HOME"), getSomeJSON("users", 10)
                ),
                [K.URL.PAGE]: page2,
            },
        ], // get match || 404 data
    ]).get(match) || {
        [K.URL.DATA]: () => getSomeJSON("users", 10),
        [K.URL.PAGE]: page2,
    }

    let data = RES[K.URL.DATA]
    let page = RES[K.URL.PAGE]

    return { [K.URL.DATA]: await data(), [K.URL.PAGE]: page }
}

const logger = registerCMD({
    sub$: "logger",
    args: ({ x }) => x,
    work: console.log,
})
//
//                              d8                        d8
//   e88~~\  e88~-_  888-~88e _d88__  e88~~8e  Y88b  /  _d88__
//  d888    d888   i 888  888  888   d888  88b  Y88b/    888
//  8888    8888   | 888  888  888   8888__888   Y88b    888
//  Y888    Y888   ' 888  888  888   Y888    ,   /Y88b   888
//   "88__/  "88_-~  888  888  "88_/  "88___/   /  Y88b  "88_/
//
//

const page = () => {
    return <div>Page</div>
}

const createCursor = atom => path => {
    const [state, setState] = useState({})
    const cursor = new Cursor(atom, path)
    cursor.addWatch(`${new Date()}`, (id, bfr, aft) => setState(aft))
    return [state, cursor]
}

//$store$.swapIn(["count"], x => 1)

const useCursor = createCursor($store$)
// default value ({ run$  }) is applied when no Provider is found in the inheritance tree of the component (orphans)
const CTX = createContext({
    run$,
    useCursor,
    $store$,
})
//@ts-ignore
const Pre = ({ children }) => <pre data={children}>{children}</pre>

// Distinct Provider component which encapsulates state and effects and prevents arbitrary rerendering
//prettier-ignore
const Provider = ({ children, CFG = {} }) => {
   
    // DOM node to mount to
    const root       = CFG[K.CFG_ROOT] || document.body
    // default wrapper for all pages
    const View       = CFG[K.CFG_VIEW] || Pre
    // 
    const router     = CFG[K.CFG_RUTR] || {}
    const log$       = CFG[K.CFG_LOG$]

    // clean URL
    const knowns     = Object.values(CFG) || []
    const prfx       = router[K.ROUTER_PRFX] || null
    const [, others] = diff_keys(knowns, CFG)
    const escRGX     = /[-/\\^$*+?.()|[\]{}]/g
    const escaped    = str => str.replace(escRGX, "\\$&")
    const RGX        = prfx ? new RegExp(escaped(prfx || ""), "g") : null

    //if (router) registerRouterDOM(router)
    //else throw new Error(`no \`${K.CFG_RUTR}\` found in Provider CFG`)
    

    const shell = state$ => {
        const Page = state$[K.$$_VIEW] || Pre
        return (
        log$ ? console.log(log$, state$) : null,
        state$[K.$$_LOAD]
            ? null
            // TODO: page component is set into the state => props.data = injector
            : (
            <View>
                <Page data={getInUnsafe(state$, state$[K.$$_PATH])}/>
            </View>
            )
        )
    }

    //$store$.resetInUnsafe(K.$$_ROOT, root)
    //$store$.swap(x => ({...x, ...CFG}))
    //console.log("$store$.deref():", $store$.deref() )

    return (
        <CTX.Provider value={{
            run$,
            useCursor,
            $store$,
            parse: () =>
              parse(window.location.href, RGX), // <- 🔍
            ...others
          }}>
            { children }
        </CTX.Provider>
    )
}

const LogButton = () => {
    // actually use the context
    //const bloop = useContext(CTX)
    //console.log("bloop:", bloop)
    const { run$, useCursor, $store$, parse } = useContext(CTX)

    const [count, countCursor] = useCursor(["count"])
    // only works if swapped-in ex-post 🤔
    //$store$.swapIn(["count"], x => 1)

    console.log("$store$.deref():", $store$.deref())

    console.log("count:", count)
    //console.log("parse:", parse())

    const increment = crs => () => crs.swap(num => num + 1)
    const decrement = crs => () => crs.swap(num => num - 1)

    return (
        <Button
            type='primary'
            onClick={
                () => {
                    countCursor.swap(x => x + 1)
                }
                //() => {
                //    run$.next([
                //        { args: { x: "hello world" } },
                //        { ...logger, args: "bloop" },
                //    ])
                //})
            }
        >
            {isObject(count) ? (countCursor.reset(0), count) : count || "?"}
        </Button>
    )
}

const page1 = () => {
    return (
        <div>
            <h1>PAGE 1</h1>
        </div>
    )
}

const page2 = () => {
    return (
        <div>
            <h1>PAGE 2</h1>
        </div>
    )
}

const App = () => {
    return (
        // @ts-ignore
        <Provider>
            <div className='App'>
                <LogButton />
            </div>
        </Provider>
    )
}

console.log("registered Commands:", out$.topics.entries())

console.log("starting...")

export default App
