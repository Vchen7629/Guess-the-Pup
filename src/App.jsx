import { useEffect, useRef } from "react"
import { useImmerReducer } from "use-immer"

function onlyUniqueBreeds (pics) {
  const uniqueBreeds = []
  const uniquePics = pics.filter(pic => {
    const breed = pic.split("/")[4]
    if (!uniqueBreeds.includes(breed) && !pic.includes(" ")) {
      uniqueBreeds.push(breed)
      return true
    }
  })
  return uniquePics.slice(0, Math.floor(uniquePics.length / 4) * 4)
}

function ourReducer(draft, action) {
  if (draft.points > draft.highScore) draft.highScore = draft.points

  switch (action.type) {  
    case "decreaseTime":
      if (draft.timeRemaining <= 0) {
        draft.playing = false
      } else {
        draft.timeRemaining--
      }
      return

    case "guessAttempt":
      if (!draft.playing)
        return

      if (action.value === draft.currentQuestion.answer) {
        draft.points++
        draft.currentQuestion = generateQuestion()
      } else {
        draft.strikes++
        if (draft.strikes >= 3) {
          draft.playing = false
        }
      }
      return

    case "startPlaying":
      draft.timeRemaining = 30
      draft.points = 0
      draft.strikes = 0
      draft.playing = true
      draft.currentQuestion = generateQuestion()
      return
    case "addToCollection": 
      draft.bigCollection = draft.bigCollection.concat(action.value)
      return

  }

  function generateQuestion () { 
    if (draft.bigCollection.length <= 12) {
      draft.fetchCount++
    }


    if (draft.currentQuestion) {
      draft.bigCollection = draft.bigCollection.slice(4, draft.bigCollection.length)
    }

    const tempRandom = Math.floor(Math.random() * 4)

    const justFour = draft.bigCollection.slice(0, 4)

    return {breed: justFour[tempRandom].split("/")[4], photos: justFour, answer: tempRandom}
  }
}

const InitialState = {
  points: 0,
  strikes: 0,
  timeRemaining: 0,
  highScore: 0, 
  bigCollection: [],
  currentQuestion: null, 
  playing: false,
  fetchCount: 0
}

function HeartIcon(props) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" fill="currentColor" className = {props.className} viewBox="0 0 16 16">
      <path d="M2.45 7.4 7.2 1.067a1 1 0 0 1 1.6 0L13.55 7.4a1 1 0 0 1 0 1.2L8.8 14.933a1 1 0 0 1-1.6 0L2.45 8.6a1 1 0 0 1 0-1.2z"/>
    </svg>
  )
}

function App() {
  const timer = useRef(null)

  const [state, dispatch] = useImmerReducer(ourReducer, InitialState)

  useEffect(() => {
    dispatch({type:"recieveHighScore", value: localStorage.getItem("highscore")})
  }, [])

  useEffect(() => {
    if (state.highScore > 0) {
      localStorage.setItem("highscore", state.high  )
    }
  }, [state.highScore])

  useEffect(() => {
    if (state.bigCollection.length) {
      state.bigCollection.slice(0, 8).forEach(pic => {
        new Image().src = pic
      })
    }
  }, [state.bigCollection])
  
  useEffect(() => {
    if (state.playing) {
      console.log("Interval created.")
      timer.current = setInterval(() => {
        dispatch({type: "decreaseTime"})
      }, 1000)

      return () => {
        console.log("interval cleared from cleanup")
        clearInterval(timer.current)
      }
    }
  }, [state.playing])

  useEffect(() => {
    const reqController = new AbortController()
    
    async function go() {  //initializing the function for getting data from api, async returnes a "promise"
      try {
        const picsPromise = await fetch("https://dog.ceo/api/breeds/image/random/50", {signal: reqController.signal}) //constant that fetches the data from api endpoint when promise from async function initializes
        const pics = await picsPromise.json()  //takes the json data from the api endpoint
        const uniquePics = onlyUniqueBreeds(pics.message)
        console.log(uniquePics)
        dispatch({type: "addToCollection", value: uniquePics})
      } catch {
        console.log("our request was cancelled.")
      }
    } go()
    
    return () => {
      reqController.abort()
    }
  } , [state.fetchCount])

  return (
    <div>

      {state.currentQuestion && (
        <>
          <p className="text-center">
            <span className="text-zinc-400 mr-3">
              <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" fill="currentColor" class={"inline-block " + (state.playing ? "animate-spin" : "")} viewBox="0 0 16 16">
                <path d="M2 14.5a.5.5 0 0 0 .5.5h11a.5.5 0 1 0 0-1h-1v-1a4.5 4.5 0 0 0-2.557-4.06c-.29-.139-.443-.377-.443-.59v-.7c0-.213.154-.451.443-.59A4.5 4.5 0 0 0 12.5 3V2h1a.5.5 0 0 0 0-1h-11a.5.5 0 0 0 0 1h1v1a4.5 4.5 0 0 0 2.557 4.06c.29.139.443.377.443.59v.7c0 .213-.154.451-.443.59A4.5 4.5 0 0 0 3.5 13v1h-1a.5.5 0 0 0-.5.5zm2.5-.5v-1a3.5 3.5 0 0 1 1.989-3.158c.533-.256 1.011-.79 1.011-1.491v-.702s.18.101.5.101.5-.1.5-.1v.7c0 .701.478 1.236 1.011 1.492A3.5 3.5 0 0 1 11.5 13v1h-7z"/>
              </svg>
              <span className="font-mono text-4xl relative top-2 ml-3"> 0:{state.timeRemaining < 10 ? "0" + state.timeRemaining : state.timeRemaining}</span>
            </span>

            {[...Array(3 - state.strikes)].map((item, index) => {
              return <HeartIcon key = {index} className="inline text-red-600 mx-1"></HeartIcon>
            })} 

            {[...Array(state.strikes)].map((item, index) => {
              return <HeartIcon key = {index} className="inline text-red-200 mx-1"></HeartIcon>
            })}
          </p>

          <h1 class="text-center font-bold pt-3 pb-10 break-all text-4xl md:text-7xl">{state.currentQuestion.breed}</h1>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 px-5">
            {state.currentQuestion.photos.map((photo, index) => {
              return <div onClick={() => dispatch({type: "guessAttempt", value: index})}key={index} className="rounded-lg h-40 lg:h-80 bg-cover bg-center" style = {{backgroundImage: `url(${photo})`}}> </div>
            })}
          </div>

        </>
      )}

      {state.playing == false && Boolean(state.bigCollection.length) && !state.currentQuestion && (
        <p className="text-center fixed top-0 bottom-0 right-0 left-0 flex justify-center items-center">
          <button onClick={() => dispatch({type: "startPlaying"})}className="text-white bg-gradient-to-b from-indigo-500 to-green-200 px-4 py-3 rounded text-2xl font-bold">
            Play
          </button>
      </p>
      )}

      {(state.timeRemaining <= 0 || state.strikes >= 3) && state.currentQuestion && (
        <div className="fixed top-0 right-0 left-0 bottom-0 bg-black/90 text-white flex justify-center items-center text-center">
          <div>
          {state.strikes >=3 && <p className="text-6xl mb-4 font-bold">You ran out of lives!</p>}
          {state.timeRemaining <= 0 && <p className="text-6xl mb-4 font-bold">Time's up</p>}

          <p>
            Your Score:{" "}
            <span className="text-amber-400">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" className="inline-block relative bottom-1 mx-1" viewBox="0 0 16 16">
                <path d="M3.612 15.443c-.386.198-.824-.149-.746-.592l.83-4.73L.173 6.765c-.329-.314-.158-.888.283-.95l4.898-.696L7.538.792c.197-.39.73-.39.927 0l2.184 4.327 4.898.696c.441.062.612.636.282.95l-3.522 3.356.83 4.73c.078.443-.36.79-.746.592L8 13.187l-4.389 2.256z"/>
              </svg>
              {state.points}
            </span>
          </p>

          <p className="mb-5">Your High Score: 0</p>

          <button onClick={() => dispatch({type: "startPlaying"})} className="text-white bg-gradient-to-b from-indigo-500 to-green-200 px-4 py-3 rounded text-lg font-bold">
            Play Again
          </button>
        </div>
        </div>
      )}

    </div>
  )
}
export default App
