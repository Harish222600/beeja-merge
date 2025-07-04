import React from 'react'

export function Table({ children }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">{children}</table>
    </div>
  )
}

export function Thead({ children }) {
  return <thead className="bg-richblack-700/50">{children}</thead>
}

export function Tbody({ children }) {
  return <tbody>{children}</tbody>
}

export function Tr({ children }) {
  return <tr className="border-b border-richblack-700">{children}</tr>
}

export function Th({ children }) {
  return (
    <th className="px-4 py-3 text-left text-sm font-medium text-richblack-100">
      {children}
    </th>
  )
}

export function Td({ children }) {
  return (
    <td className="px-4 py-3 text-sm text-richblack-100">
      {children}
    </td>
  )
}
