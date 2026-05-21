import { useMemo, useState } from 'react'

const categories = {
  Length: {
    Meter: { symbol: 'm', toBase: (value) => value, fromBase: (value) => value },
    Kilometer: { symbol: 'km', toBase: (value) => value * 1000, fromBase: (value) => value / 1000 },
    Centimeter: { symbol: 'cm', toBase: (value) => value / 100, fromBase: (value) => value * 100 },
    Inch: { symbol: 'in', toBase: (value) => value * 0.0254, fromBase: (value) => value / 0.0254 },
    Foot: { symbol: 'ft', toBase: (value) => value * 0.3048, fromBase: (value) => value / 0.3048 },
    Mile: { symbol: 'mi', toBase: (value) => value * 1609.344, fromBase: (value) => value / 1609.344 },
  },
  Weight: {
    Gram: { symbol: 'g', toBase: (value) => value, fromBase: (value) => value },
    Kilogram: { symbol: 'kg', toBase: (value) => value * 1000, fromBase: (value) => value / 1000 },
    Ounce: { symbol: 'oz', toBase: (value) => value * 28.349523125, fromBase: (value) => value / 28.349523125 },
    Pound: { symbol: 'lb', toBase: (value) => value * 453.59237, fromBase: (value) => value / 453.59237 },
  },
  Temperature: {
    Celsius: { symbol: 'C', toBase: (value) => value, fromBase: (value) => value },
    Fahrenheit: { symbol: 'F', toBase: (value) => (value - 32) * (5 / 9), fromBase: (value) => value * (9 / 5) + 32 },
    Kelvin: { symbol: 'K', toBase: (value) => value - 273.15, fromBase: (value) => value + 273.15 },
  },
  Data: {
    Byte: { symbol: 'B', toBase: (value) => value, fromBase: (value) => value },
    Kilobyte: { symbol: 'KB', toBase: (value) => value * 1024, fromBase: (value) => value / 1024 },
    Megabyte: { symbol: 'MB', toBase: (value) => value * 1024 ** 2, fromBase: (value) => value / 1024 ** 2 },
    Gigabyte: { symbol: 'GB', toBase: (value) => value * 1024 ** 3, fromBase: (value) => value / 1024 ** 3 },
    Terabyte: { symbol: 'TB', toBase: (value) => value * 1024 ** 4, fromBase: (value) => value / 1024 ** 4 },
  },
}

function formatNumber(value) {
  if (!Number.isFinite(value)) return ''
  return Number.parseFloat(value.toFixed(8)).toString()
}

function convert(value, fromUnit, toUnit, unitMap) {
  const numericValue = Number(value)
  if (value === '' || !Number.isFinite(numericValue)) return ''
  const base = unitMap[fromUnit].toBase(numericValue)
  return formatNumber(unitMap[toUnit].fromBase(base))
}

export function UnitConverter() {
  const categoryNames = Object.keys(categories)
  const [category, setCategory] = useState('Length')
  const units = useMemo(() => Object.keys(categories[category]), [category])
  const [leftUnit, setLeftUnit] = useState('Meter')
  const [rightUnit, setRightUnit] = useState('Foot')
  const [leftValue, setLeftValue] = useState('1')
  const [rightValue, setRightValue] = useState(() => convert('1', 'Meter', 'Foot', categories.Length))

  function changeCategory(nextCategory) {
    const nextUnits = Object.keys(categories[nextCategory])
    const nextLeft = nextUnits[0]
    const nextRight = nextUnits[1] ?? nextUnits[0]
    setCategory(nextCategory)
    setLeftUnit(nextLeft)
    setRightUnit(nextRight)
    setLeftValue('1')
    setRightValue(convert('1', nextLeft, nextRight, categories[nextCategory]))
  }

  function changeLeftValue(value) {
    setLeftValue(value)
    setRightValue(convert(value, leftUnit, rightUnit, categories[category]))
  }

  function changeRightValue(value) {
    setRightValue(value)
    setLeftValue(convert(value, rightUnit, leftUnit, categories[category]))
  }

  function changeLeftUnit(unit) {
    setLeftUnit(unit)
    setRightValue(convert(leftValue, unit, rightUnit, categories[category]))
  }

  function changeRightUnit(unit) {
    setRightUnit(unit)
    setRightValue(convert(leftValue, leftUnit, unit, categories[category]))
  }

  const hasInvalidInput = (leftValue !== '' && Number.isNaN(Number(leftValue))) || (rightValue !== '' && Number.isNaN(Number(rightValue)))

  return (
    <div className="tool-body">
      <div className="category-tabs compact" aria-label="Converter categories">
        {categoryNames.map((item) => (
          <button
            key={item}
            type="button"
            className={item === category ? 'is-active' : ''}
            onClick={() => changeCategory(item)}
          >
            {item}
          </button>
        ))}
      </div>

      <div className="converter-grid">
        <div className="control-stack">
          <label htmlFor="left-value">From</label>
          <input
            id="left-value"
            type="number"
            inputMode="decimal"
            value={leftValue}
            onChange={(event) => changeLeftValue(event.target.value)}
          />
          <select value={leftUnit} onChange={(event) => changeLeftUnit(event.target.value)} aria-label="From unit">
            {units.map((unit) => (
              <option key={unit} value={unit}>
                {unit} ({categories[category][unit].symbol})
              </option>
            ))}
          </select>
        </div>

        <div className="equals-mark">=</div>

        <div className="control-stack">
          <label htmlFor="right-value">To</label>
          <input
            id="right-value"
            type="number"
            inputMode="decimal"
            value={rightValue}
            onChange={(event) => changeRightValue(event.target.value)}
          />
          <select value={rightUnit} onChange={(event) => changeRightUnit(event.target.value)} aria-label="To unit">
            {units.map((unit) => (
              <option key={unit} value={unit}>
                {unit} ({categories[category][unit].symbol})
              </option>
            ))}
          </select>
        </div>
      </div>

      <p className="helper-text">
        {hasInvalidInput ? 'Enter a valid number to convert.' : `Converting ${category.toLowerCase()} units locally in your browser.`}
      </p>
    </div>
  )
}
