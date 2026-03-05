import { type UseDataTableReturn } from '@medusajs/ui'
import * as PopoverPrimitive from '@radix-ui/react-popover'
import { useEffect, useRef, useState } from 'react'

export type DataTableBulkActionsToolbarProps<TData> = {
    table: UseDataTableReturn<TData>
    entityName: string
    children: React.ReactNode
}

/**
 * A modular toolbar for displaying bulk actions when table rows are selected.
 *
 * @template TData The type of data in the table.
 * @param {object} props The component props.
 * @param {UseDataTableReturn<TData>} props.table The react-table instance.
 * @param {string} props.entityName The name of the entity being acted upon (e.g., "task", "user").
 * @param {React.ReactNode} props.children The action buttons to be rendered inside the toolbar.
 * @returns {React.ReactNode | null} The rendered component or null if no rows are selected.
 */
export function DataTableBulkActionsToolbar<TData>({
    table,
    entityName,
    children,
}: DataTableBulkActionsToolbarProps<TData>): React.ReactNode | null {
    const selectedRows = table.getRowModel().rows.filter((row) => row.getIsSelected())
    const selectedCount = selectedRows.length
    const toolbarRef = useRef<HTMLDivElement>(null)
    const [announcement, setAnnouncement] = useState('')

    // Announce selection changes to screen readers
    useEffect(() => {
        if (selectedCount > 0) {
            const message = `${selectedCount} ${entityName}${selectedCount > 1 ? 's' : ''} selected. Bulk actions toolbar is available.`

            // Use queueMicrotask to defer state update and avoid cascading renders
            queueMicrotask(() => {
                setAnnouncement(message)
            })

            // Clear announcement after a delay
            const timer = setTimeout(() => setAnnouncement(''), 3000)
            return () => clearTimeout(timer)
        }
    }, [selectedCount, entityName])

    const handleClearSelection = () => {
        selectedRows.forEach((row) => row.toggleSelected(false))
    }

    const handleKeyDown = (event: React.KeyboardEvent) => {
        const buttons = toolbarRef.current?.querySelectorAll('button')
        if (!buttons) return

        const currentIndex = Array.from(buttons).findIndex(
            (button) => button === document.activeElement
        )

        switch (event.key) {
            case 'ArrowRight': {
                event.preventDefault()
                const nextIndex = (currentIndex + 1) % buttons.length
                buttons[nextIndex]?.focus()
                break
            }
            case 'ArrowLeft': {
                event.preventDefault()
                const prevIndex =
                    currentIndex === 0 ? buttons.length - 1 : currentIndex - 1
                buttons[prevIndex]?.focus()
                break
            }
            case 'Home':
                event.preventDefault()
                buttons[0]?.focus()
                break
            case 'End':
                event.preventDefault()
                buttons[buttons.length - 1]?.focus()
                break
            case 'Escape': {
                // Check if the Escape key came from a dropdown trigger or content
                // We can't check dropdown state because Radix UI closes it before our handler runs
                const target = event.target as HTMLElement
                const activeElement = document.activeElement as HTMLElement

                // Check if the event target or currently focused element is a dropdown trigger
                const isFromDropdownTrigger =
                    target?.getAttribute('data-slot') === 'dropdown-menu-trigger' ||
                    activeElement?.getAttribute('data-slot') ===
                    'dropdown-menu-trigger' ||
                    target?.closest('[data-slot="dropdown-menu-trigger"]') ||
                    activeElement?.closest('[data-slot="dropdown-menu-trigger"]')

                // Check if the focused element is inside dropdown content (which is portaled)
                const isFromDropdownContent =
                    activeElement?.closest('[data-slot="dropdown-menu-content"]') ||
                    target?.closest('[data-slot="dropdown-menu-content"]')

                if (isFromDropdownTrigger || isFromDropdownContent) {
                    // Escape was meant for the dropdown - don't clear selection
                    return
                }

                // Escape was meant for the toolbar - clear selection
                event.preventDefault()
                handleClearSelection()
                break
            }
        }
    }

    if (selectedCount === 0) {
        return null
    }

    return (
        <PopoverPrimitive.Root open={selectedCount > 0}>
            {/* Live region for screen reader announcements */}
            <div
                aria-live='polite'
                aria-atomic='true'
                className='sr-only'
                role='status'
            >
                {announcement}
            </div>

            {/* Invisible anchor positioned at bottom center */}
            <PopoverPrimitive.Anchor
                className='fixed bottom-6 left-1/2 -translate-x-1/2 pointer-events-none'
            />

            <PopoverPrimitive.Portal>
                <PopoverPrimitive.Content
                    ref={toolbarRef}
                    role='toolbar'
                    aria-label={`Bulk actions for ${selectedCount} selected ${entityName}${selectedCount > 1 ? 's' : ''}`}
                    aria-describedby='bulk-actions-description'
                    side="top"
                    align="center"
                    sideOffset={0}
                    onKeyDown={handleKeyDown}
                    onEscapeKeyDown={(e) => {
                        // Check if escape is from dropdown
                        const target = e.target as HTMLElement
                        const activeElement = document.activeElement as HTMLElement

                        const isFromDropdownTrigger =
                            target?.getAttribute('data-slot') === 'dropdown-menu-trigger' ||
                            activeElement?.getAttribute('data-slot') === 'dropdown-menu-trigger' ||
                            target?.closest('[data-slot="dropdown-menu-trigger"]') ||
                            activeElement?.closest('[data-slot="dropdown-menu-trigger"]')

                        const isFromDropdownContent =
                            activeElement?.closest('[data-slot="dropdown-menu-content"]') ||
                            target?.closest('[data-slot="dropdown-menu-content"]')

                        if (!isFromDropdownTrigger && !isFromDropdownContent) {
                            handleClearSelection()
                        } else {
                            e.preventDefault()
                        }
                    }}
                    className="dark:bg-ui-contrast-bg-base bg-ui-bg-base relative flex items-center border overflow-hidden rounded-full px-1 after:shadow-elevation-flyout after:pointer-events-none after:absolute after:inset-0 after:rounded-full after:content-['']"
                >

                    <div className='txt-compact-small-plus dark:text-ui-contrast-fg-secondary text-ui-fg-secondary px-3 py-2.5'>
                        {selectedCount} selected
                    </div>
                    <div className="dark:bg-ui-contrast-border-base bg-ui-border-base h-10 w-px"></div>
                    {children}
                </PopoverPrimitive.Content>
            </PopoverPrimitive.Portal>
        </PopoverPrimitive.Root>
    )
}