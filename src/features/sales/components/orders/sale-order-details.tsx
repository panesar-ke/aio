import { createId } from '@paralleldrive/cuid2';
import { PlusIcon, Trash2Icon } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { FieldGroup } from '@/components/ui/field';
import { SelectItem } from '@/components/ui/select';
import { calculateSaleOrderLineGross } from '@/features/sales/components/orders/sale-order-line-gross';
import { FURNITURE_CATEGORIES } from '@/features/sales/utils/constants';
import { saleOrderFormOpts } from '@/features/sales/utils/form';
import { withForm } from '@/lib/form';
import { numberFormat } from '@/lib/helpers/formatters';
import { cn } from '@/lib/utils';

function lineHeaderClass(width: string, align: 'left' | 'center' = 'left') {
  return cn(
    'whitespace-nowrap border-b bg-muted px-3 py-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground',
    align === 'center' ? 'text-center' : 'text-left',
    width,
  );
}

function lineCellClass(width: string) {
  return cn(
    'flex items-center gap-2 py-1.5 before:w-24 before:shrink-0 before:text-[11px] before:font-semibold before:uppercase before:tracking-[0.04em] before:text-muted-foreground before:content-[attr(data-label)] md:table-cell md:px-2 md:py-1.5 md:align-middle md:before:hidden',
    width,
  );
}

function readonlyCellClass() {
  return 'flex h-10 w-full items-center justify-end border border-transparent px-3 text-sm tabular-nums text-muted-foreground';
}

export const SaleOrderDetails = withForm({
  ...saleOrderFormOpts(),
  render: ({ form }) => {
    return (
      <form.AppField name='details' mode='array'>
        {(field) => {
          const addLine = () => {
            field.pushValue({
              id: createId(),
              item: '',
              category: '',
              qty: 1,
              rate: 1,
            });
          };
          return (
            <section className='bg-white border rounded-lg shadow-sm gap-0 overflow-hidden '>
              <div className='flex flex-wrap items-center justify-between gap-3 border-b px-5 py-4'>
                <div>
                  <h2 className='text-sm font-semibold text-card-foreground'>
                    Order Lines
                  </h2>
                  <p className='mt-0.5 text-xs text-muted-foreground'>
                    Add each item.
                  </p>
                </div>
                <Button
                  type='button'
                  variant='outline'
                  size='sm'
                  onClick={addLine}
                  className='border-primary text-xs text-primary hover:bg-primary/10'
                >
                  <PlusIcon className='size-3.5' />
                  Add Line
                </Button>
              </div>
              <FieldGroup className='overflow-x-auto gap-0'>
                <table
                  aria-label='Item Details'
                  className='w-full border-collapse md:table-fixed'
                >
                  <thead className='hidden md:table-header-group'>
                    <tr>
                      <th className={lineHeaderClass('w-10', 'center')}>#</th>
                      <th className={lineHeaderClass('w-72')}>
                        Item <span className='text-destructive'>*</span>
                      </th>
                      <th className={lineHeaderClass('w-24 min-w-20')}>
                        Qty <span className='text-destructive'>*</span>
                      </th>
                      <th className={lineHeaderClass('w-40')}>
                        <form.Subscribe
                          selector={(state) => state.values.currency}
                        >
                          {(currency) => <>Rate ({currency})</>}
                        </form.Subscribe>{' '}
                        <span className='text-destructive'>*</span>
                      </th>
                      <th className={cn(lineHeaderClass('w-40'), 'text-right')}>
                        <form.Subscribe
                          selector={(state) => state.values.currency}
                        >
                          {(currency) => <>Gross ({currency})</>}
                        </form.Subscribe>{' '}
                        <span className='text-destructive'>*</span>
                      </th>
                      <th className={lineHeaderClass('w-56')}>
                        Category <span className='text-destructive'>*</span>
                      </th>
                      <th className='w-11 border-b bg-muted px-2 py-2'>
                        <span className='sr-only'>Actions</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className='block w-full md:table-row-group'>
                    {field.state.value.map((f, i) => {
                      return (
                        <tr
                          key={f.id}
                          className='mb-3 block w-full rounded-lg border bg-card p-3 transition-colors md:mb-0 md:table-row md:rounded-none md:border-0 md:p-0 md:[&>td]:border-b md:[&>td]:border-border md:last:[&>td]:border-b-0 md:hover:[&>td]:bg-muted/40'
                        >
                          <td
                            data-label='#'
                            className='hidden md:table-cell md:w-10 md:px-2 md:py-1.5 md:text-center md:align-middle md:text-[11px] md:text-muted-foreground'
                          >
                            {i + 1}
                          </td>
                          <td
                            data-label='Item'
                            className={lineCellClass('md:w-72')}
                          >
                            <form.AppField name={`details[${i}].item`}>
                              {(field) => (
                                <field.Input
                                  aria-label={`Item for line ${i + 1}`}
                                  label=''
                                  className='w-full'
                                />
                              )}
                            </form.AppField>
                          </td>
                          <td
                            data-label='Qty'
                            className={lineCellClass('md:w-24')}
                          >
                            <form.AppField name={`details[${i}].qty`}>
                              {(field) => (
                                <field.Input
                                  label=''
                                  type='number'
                                  className='w-full'
                                  aria-label={`Quantity for line ${i + 1}`}
                                />
                              )}
                            </form.AppField>
                          </td>
                          <td
                            data-label='Rate'
                            className={lineCellClass(
                              'md:w-40 md:max-w-40 md:overflow-hidden',
                            )}
                          >
                            <form.AppField name={`details[${i}].rate`}>
                              {(field) => (
                                <field.Input
                                  label=''
                                  type='number'
                                  className='w-full'
                                  aria-label={`Rate for line ${i + 1}`}
                                />
                              )}
                            </form.AppField>
                          </td>
                          <td
                            data-label='Gross'
                            className={lineCellClass(
                              'md:w-40 md:max-w-40 md:overflow-hidden',
                            )}
                          >
                            <form.Subscribe
                              selector={(state) =>
                                calculateSaleOrderLineGross(
                                  state.values.details[i],
                                )
                              }
                            >
                              {(gross) => (
                                <div className={readonlyCellClass()}>
                                  {numberFormat(gross)}
                                </div>
                              )}
                            </form.Subscribe>
                          </td>
                          <td
                            data-label='Category'
                            className={lineCellClass('md:w-56')}
                          >
                            <form.AppField name={`details[${i}].category`}>
                              {(field) => (
                                <field.Select
                                  label=''
                                  className='w-full'
                                  placeholder='Select category'
                                  aria-label={`Category for line ${i + 1}`}
                                >
                                  {FURNITURE_CATEGORIES.map((c) => (
                                    <SelectItem key={c.value} value={c.value}>
                                      {c.label}
                                    </SelectItem>
                                  ))}
                                </field.Select>
                              )}
                            </form.AppField>
                          </td>
                          <td
                            className='
                          flex justify-end pt-2
                          md:table-cell md:w-11 md:px-2 md:py-1.5
                          md:text-center md:align-middle'
                          >
                            <Button
                              type='button'
                              variant='ghost'
                              size='icon-sm'
                              onClick={() => field.removeValue(i)}
                              aria-label={`Remove line ${i + 1}`}
                              className='text-muted-foreground hover:bg-destructive/10 hover:text-destructive'
                            >
                              <Trash2Icon
                                className='size-3.5'
                                strokeWidth={2.5}
                                aria-hidden='true'
                              />
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                {field.state.value?.length === 0 && (
                  <div className='flex flex-col items-center justify-center px-4 py-12 text-center'>
                    <p className='text-sm font-medium text-foreground'>
                      No lines added
                    </p>
                    <p className='mt-1 text-xs text-muted-foreground'>
                      Click &quot;Add Line&quot; to start adding items or
                      services.
                    </p>
                  </div>
                )}
                {field.state.value.length > 0 && (
                  <div className='flex items-center justify-between border-t px-5 py-3'>
                    <p className='text-xs text-muted-foreground'>
                      {field.state.value.length}{' '}
                      {field.state.value.length === 1 ? 'line' : 'lines'}
                    </p>

                    <Button
                      type='button'
                      onClick={addLine}
                      size='sm'
                      variant='link'
                      className='hover:no-underline hover:text-muted-foreground'
                    >
                      + Add another line
                    </Button>
                  </div>
                )}
              </FieldGroup>
            </section>
          );
        }}
      </form.AppField>
    );
  },
});
