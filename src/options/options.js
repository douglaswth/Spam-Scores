import { DEFAULT_SCORE_LOWER_BOUNDS, DEFAULT_SCORE_UPPER_BOUNDS } from '../constants.js'
import { getBounds } from '../functions.js'

// DOM Variables
const inputScoreBoundsLower = document.getElementById('score-bounds-lower')
const inputScoreBoundsUpper = document.getElementById('score-bounds-upper')
const inputScoreBoundsBetween = document.getElementById('score-bounds-between')
const checkboxIconScorePositive = document.getElementById('hide-icon-score-positive')
const checkboxIconScoreNeutral = document.getElementById('hide-icon-score-neutral')
const checkboxIconScoreNegative = document.getElementById('hide-icon-score-negative')

// Translations
const i18n = messenger.i18n
for (const i18nKey of ['optionsIconRanges', 'optionsScoreGreater', 'optionsScoreLess']) {
  document.querySelector('*[data-i18n="' + i18nKey + '"]').textContent = i18n.getMessage(i18nKey)
}
document
  .querySelectorAll('*[data-i18n="optionsHideIconAndScore"]')
  .forEach(el => (el.textContent = i18n.getMessage('optionsHideIconAndScore')))

// DOM Events

/**
 * TODO: [General] For every event from one input, it gets all data from the others,
 * which is not optimized
 */
inputScoreBoundsLower.addEventListener('change', save)
inputScoreBoundsUpper.addEventListener('change', save)
checkboxIconScorePositive.addEventListener('change', save)
checkboxIconScoreNeutral.addEventListener('change', save)
checkboxIconScoreNegative.addEventListener('change', save)

async function init() {
  // Load Values from Storage
  const storage = await messenger.storage.local.get([
    'scoreIconLowerBounds',
    'scoreIconUpperBounds',
    'hideIconScorePositive',
    'hideIconScoreNeutral',
    'hideIconScoreNegative'
  ])

  const [lowerBounds, upperBounds] = getBounds(storage)

  // Set Values
  inputScoreBoundsLower.value = lowerBounds
  inputScoreBoundsUpper.value = upperBounds
  inputScoreBoundsBetween.textContent = messenger.i18n.getMessage('optionsScoreBetween', [lowerBounds, upperBounds])
  ;(await messenger.runtime.getBackgroundPage()).messenger.SpamScores.setScoreBounds(lowerBounds, upperBounds)

  checkboxIconScorePositive.checked = storage.hideIconScorePositive || false
  checkboxIconScoreNeutral.checked = storage.hideIconScoreNeutral || false
  checkboxIconScoreNegative.checked = storage.hideIconScoreNegative || false
}
init()

/**
 * Everytime you modify an option is saves.
 */
async function save() {
  // Get Values that can kill the program
  const scoreBoundsLower = inputScoreBoundsLower.value
  const scoreBoundsUpper = inputScoreBoundsUpper.value
  let canSave = true

  // Checkers
  canSave = scoreBoundsLower !== ''
  canSave = scoreBoundsUpper !== ''

  let newLowerBounds, newUpperBounds
  if (canSave) {
    newLowerBounds = parseFloat(scoreBoundsLower)
    newUpperBounds = parseFloat(scoreBoundsUpper)
    try {
      if (newLowerBounds > newUpperBounds) throw Error('Upper score cannot be lower than lower bounds')
      if (newLowerBounds < -10000) throw Error('Wrong score lower bounds')
      if (newUpperBounds > 10000) throw Error('Wrong score upper bounds')
    } catch (error) {
      canSave = false
    }
  }

  // Get rest of values
  const hideIconScorePositive = checkboxIconScorePositive.checked
  const hideIconScoreNeutral = checkboxIconScoreNeutral.checked
  const hideIconScoreNegative = checkboxIconScoreNegative.checked

  const localStorage = messenger.storage.local

  // If we can save
  if (canSave) {
    // Declaration
    localStorage.set({
      scoreIconLowerBounds: newLowerBounds,
      scoreIconUpperBounds: newUpperBounds
    })
  } else {
    // Restore data or Defaults
    const storage = await localStorage.get(['scoreIconLowerBounds', 'scoreIconUpperBounds'])
    newLowerBounds = parseFloat(storage.scoreIconLowerBounds || DEFAULT_SCORE_LOWER_BOUNDS)
    newUpperBounds = parseFloat(storage.scoreIconUpperBounds || DEFAULT_SCORE_UPPER_BOUNDS)
  }
  // This way the value is a number
  inputScoreBoundsLower.value = newLowerBounds
  inputScoreBoundsUpper.value = newUpperBounds
  inputScoreBoundsBetween.textContent = messenger.i18n.getMessage('optionsScoreBetween', [
    newLowerBounds,
    newUpperBounds
  ])
  ;(await messenger.runtime.getBackgroundPage()).messenger.SpamScores.setScoreBounds(newLowerBounds, newUpperBounds)
  ;(await messenger.runtime.getBackgroundPage()).messenger.SpamScores.setHideIconScoreOptions(
    hideIconScorePositive,
    hideIconScoreNeutral,
    hideIconScoreNegative
  )
  // Why restore hideIcon when you can always save?

  localStorage.set({
    hideIconScorePositive,
    hideIconScoreNeutral,
    hideIconScoreNegative
  })
}
