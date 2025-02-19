import Head from "next/head"
import { useEffect, useState  } from "react"
import netlifyIdentity from "netlify-identity-widget"
import { attributes, react as HomeContent } from "../content/home.md"
import tasks from "../lib/tasks"

function Home() {
  let { title } = attributes
  const [token, setToken] = useState("")
  const API_URL = "http://localhost:8080/api/contribution/auth"
  function login(event) {
    event.preventDefault()
    netlifyIdentity.open()
  }

  function retrieveAccessToken() {
    const user = netlifyIdentity.currentUser()
    return user ? user.token.access_token : ""
  }

  async function initNetlify() {
    await netlifyIdentity.init()
    setToken(retrieveAccessToken())
  }

  useEffect(() => {
    initNetlify()
  })

  return (
    <>
      <style jsx>{`
        li {
          list-style: none;
        }

        a {
          text-decoration: none;
        }
      `}</style>
      <Head></Head>
      <article>
        <h1>{title}</h1>
        <HomeContent />

        <ul>
          {tasks.map((task, k) => (
            <li key={k}>
              <h3>
                <a href={`/tasks/${task.slug}`}>
                  {task.attributes.title} (≈&nbsp;{task.attributes.duration}
                  &nbsp;min.)
                </a>
              </h3>
            </li>
          ))}
          <li>
            <h3>
            {token ?
              <form
                action={API_URL}
                method="POST"
                className="contribution-form"
              >
                <img src="https://www.1jeune1solution.gouv.fr/assets/favicons/favicon-32x32.png" alt="Image 1 jeune 1 solution" />
                <input type="hidden" name="token" value={token} />
                <input
                  className="contribution-submit"
                  type="submit"
                  value="Contribuer sur la plateforme 1 jeune 1 solution."
                />
              </form>
              : <button className="contribution-submit" onClick={login}>🔒 Se connecter pour contribuer sur la plateforme 1 jeune 1 solution.</button>
            }
          </h3></li>


        </ul>
      </article>
    </>
  )
}

export default Home
