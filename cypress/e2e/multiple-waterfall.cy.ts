/**
 * E2E Tests for Multiple Discount Waterfall Component
 *
 * Tests the MultipleWaterfall component rendering and functionality,
 * verifying that the discount pipeline displays correctly in the UI.
 */

describe('Multiple Discount Waterfall', () => {
  beforeEach(() => {
    // NOTE: These are placeholder tests. To run them:
    // 1. Set up Cypress test environment
    // 2. Create fixture data for valuation responses with multiple_pipeline
    // 3. Update selectors to match actual component implementation

    // Visit the application
    cy.visit('/')

    // Mock API response with multiple_pipeline data
    cy.intercept('POST', '/api/valuations', {
      statusCode: 200,
      body: {
        // Mock valuation response with multiple_pipeline
        multiple_pipeline: {
          initial_multiple: 10.0,
          final_multiple: 6.48,
          total_reduction_percentage: -35.2,
          metric_type: 'EBITDA',
          metric_value: 1000000,
          stages: [
            {
              step_number: 4,
              step_name: 'Owner Concentration',
              discount_type: 'owner_concentration',
              discount_percentage: -20.0,
              multiple_before: 10.0,
              multiple_after: 8.0,
              metric_value: 1000000,
              ev_before: 10000000,
              ev_after: 8000000,
              explanation: 'High key person risk - 20.0% discount',
            },
            {
              step_number: 5,
              step_name: 'Size Discount',
              discount_type: 'size',
              discount_percentage: -10.0,
              multiple_before: 8.0,
              multiple_after: 7.2,
              metric_value: 1000000,
              ev_before: 8000000,
              ev_after: 7200000,
              explanation: 'Micro company - 10.0% discount',
            },
            {
              step_number: 6,
              step_name: 'Liquidity Discount',
              discount_type: 'liquidity',
              discount_percentage: -10.0,
              multiple_before: 7.2,
              multiple_after: 6.48,
              metric_value: 1000000,
              ev_before: 7200000,
              ev_after: 6480000,
              explanation: 'Private company illiquidity - 10.0% discount',
            },
          ],
        },
      },
    }).as('getValuation')

    // Complete valuation form and submit
    // TODO: Replace with actual form filling logic
  })

  describe('Waterfall Table Rendering', () => {
    it('should render the waterfall table when pipeline data exists', () => {
      // Wait for valuation to complete
      cy.wait('@getValuation')

      // Verify waterfall component is visible
      cy.contains('Multiple Discount Waterfall').should('be.visible')

      // Verify table structure exists
      cy.get('table').should('exist')
      cy.get('thead').should('exist')
      cy.get('tbody').should('exist')
    })

    it('should display summary section with correct values', () => {
      cy.wait('@getValuation')

      // Verify summary displays initial multiple
      cy.contains('Initial Multiple').should('be.visible')
      cy.contains('10.00x').should('be.visible')

      // Verify summary displays final multiple
      cy.contains('Final Multiple').should('be.visible')
      cy.contains('6.48x').should('be.visible')

      // Verify summary displays total reduction
      cy.contains('Total Reduction').should('be.visible')
      cy.contains('-35.2%').should('be.visible')
    })

    it('should render all discount stages in the table', () => {
      cy.wait('@getValuation')

      // Verify 3 discount stages + initial + final rows = 5 rows
      cy.get('tbody tr').should('have.length', 5)

      // Verify each stage is present
      cy.contains('Owner Concentration').should('be.visible')
      cy.contains('Size Discount').should('be.visible')
      cy.contains('Liquidity Discount').should('be.visible')
    })

    it('should not render waterfall when pipeline data is missing', () => {
      // Mock response without multiple_pipeline
      cy.intercept('POST', '/api/valuations', {
        statusCode: 200,
        body: {
          // No multiple_pipeline field
        },
      })

      // Submit valuation
      // TODO: Fill form and submit

      // Verify waterfall is not rendered
      cy.contains('Multiple Discount Waterfall').should('not.exist')
    })
  })

  describe('Multiple Values Display', () => {
    it('should display correct multiple_before for each stage', () => {
      cy.wait('@getValuation')

      // Verify Step 4: multiple_before = 10.0x
      cy.get('tbody tr')
        .eq(1)
        .within(() => {
          cy.contains('10.00x').should('be.visible')
        })

      // Verify Step 5: multiple_before = 8.0x
      cy.get('tbody tr')
        .eq(2)
        .within(() => {
          cy.contains('8.00x').should('be.visible')
        })

      // Verify Step 6: multiple_before = 7.2x
      cy.get('tbody tr')
        .eq(3)
        .within(() => {
          cy.contains('7.20x').should('be.visible')
        })
    })

    it('should display correct multiple_after for each stage', () => {
      cy.wait('@getValuation')

      // Verify Step 4: multiple_after = 8.0x
      cy.get('tbody tr')
        .eq(1)
        .within(() => {
          cy.contains('8.00x').should('be.visible')
        })

      // Verify Step 5: multiple_after = 7.2x
      cy.get('tbody tr')
        .eq(2)
        .within(() => {
          cy.contains('7.20x').should('be.visible')
        })

      // Verify Step 6: multiple_after = 6.48x
      cy.get('tbody tr')
        .eq(3)
        .within(() => {
          cy.contains('6.48x').should('be.visible')
        })
    })

    it('should highlight final multiple in bold', () => {
      cy.wait('@getValuation')

      // Verify final row has bold styling
      cy.get('tbody tr')
        .last()
        .within(() => {
          cy.contains('6.48x').should('have.class', 'font-bold')
        })
    })
  })

  describe('Discount Percentages Display', () => {
    it('should display correct discount percentages', () => {
      cy.wait('@getValuation')

      // Verify -20% for owner concentration
      cy.get('tbody tr')
        .eq(1)
        .within(() => {
          cy.contains('-20.0%').should('be.visible')
        })

      // Verify -10% for size discount
      cy.get('tbody tr')
        .eq(2)
        .within(() => {
          cy.contains('-10.0%').should('be.visible')
        })

      // Verify -10% for liquidity discount
      cy.get('tbody tr')
        .eq(3)
        .within(() => {
          cy.contains('-10.0%').should('be.visible')
        })
    })

    it('should show negative discounts in red', () => {
      cy.wait('@getValuation')

      // Verify discount percentages have red styling
      cy.get('tbody tr')
        .eq(1)
        .within(() => {
          cy.contains('-20.0%').should('have.class', 'text-red-600')
        })
    })

    it('should show positive adjustments in green', () => {
      // Mock response with positive adjustment (premium)
      cy.intercept('POST', '/api/valuations', {
        statusCode: 200,
        body: {
          multiple_pipeline: {
            initial_multiple: 10.0,
            final_multiple: 11.0,
            total_reduction_percentage: 10.0,
            metric_type: 'EBITDA',
            metric_value: 1000000,
            stages: [
              {
                step_number: 4,
                step_name: 'Growth Premium',
                discount_type: 'growth',
                discount_percentage: 10.0, // Positive
                multiple_before: 10.0,
                multiple_after: 11.0,
                metric_value: 1000000,
                ev_before: 10000000,
                ev_after: 11000000,
                explanation: 'Strong growth premium',
              },
            ],
          },
        },
      })

      // TODO: Submit form

      // Verify positive percentage is green
      cy.contains('+10.0%').should('have.class', 'text-green-600')
    })
  })

  describe('Formula Reconciliation', () => {
    it('should display formula with correct values', () => {
      cy.wait('@getValuation')

      // Verify formula is displayed
      cy.contains('Final Valuation:').should('be.visible')
      cy.contains('€1,000,000 (EBITDA)').should('be.visible')
      cy.contains('6.48x').should('be.visible')
      cy.contains('€6,480,000').should('be.visible')
    })

    it('should show correct calculation: metric × multiple = EV', () => {
      cy.wait('@getValuation')

      // Verify the formula is mathematically correct
      // €1M × 6.48x = €6.48M
      cy.contains('€1,000,000 (EBITDA) × 6.48x = €6,480,000').should('be.visible')
    })
  })

  describe('EV Impact Display', () => {
    it('should display EV values for each stage', () => {
      cy.wait('@getValuation')

      // Verify initial EV
      cy.get('tbody tr')
        .first()
        .within(() => {
          cy.contains('€10,000,000').should('be.visible')
        })

      // Verify final EV
      cy.get('tbody tr')
        .last()
        .within(() => {
          cy.contains('€6,480,000').should('be.visible')
        })
    })

    it('should format currency values correctly', () => {
      cy.wait('@getValuation')

      // Verify currency formatting (commas, no decimals for round numbers)
      cy.contains('€10,000,000').should('be.visible')
      cy.contains('€8,000,000').should('be.visible')
      cy.contains('€7,200,000').should('be.visible')
      cy.contains('€6,480,000').should('be.visible')
    })
  })

  describe('Responsive Design', () => {
    it('should display correctly on desktop', () => {
      cy.viewport(1920, 1080)
      cy.wait('@getValuation')

      // Verify table is visible and not scrolling
      cy.get('table').should('be.visible')
      cy.get('.overflow-x-auto').should('not.have.class', 'overflow-scroll')
    })

    it('should enable horizontal scroll on mobile', () => {
      cy.viewport(375, 667) // iPhone SE
      cy.wait('@getValuation')

      // Verify table container allows horizontal scrolling
      cy.get('.overflow-x-auto').should('exist')
    })
  })

  describe('Explanations Display', () => {
    it('should display explanation text for each stage', () => {
      cy.wait('@getValuation')

      // Verify explanations are visible
      cy.contains('High key person risk - 20.0% discount').should('be.visible')
      cy.contains('Micro company - 10.0% discount').should('be.visible')
      cy.contains('Private company illiquidity - 10.0% discount').should('be.visible')
    })
  })

  describe('Accessibility', () => {
    it('should have proper table headers', () => {
      cy.wait('@getValuation')

      // Verify all required headers exist
      cy.get('thead th').should('contain', 'Stage')
      cy.get('thead th').should('contain', 'Description')
      cy.get('thead th').should('contain', 'Discount')
      cy.get('thead th').should('contain', 'Multiple Before')
      cy.get('thead th').should('contain', 'Multiple After')
      cy.get('thead th').should('contain', 'EV Impact')
    })

    it('should have semantic HTML structure', () => {
      cy.wait('@getValuation')

      // Verify proper table structure
      cy.get('table').within(() => {
        cy.get('thead').should('exist')
        cy.get('tbody').should('exist')
        cy.get('th').should('exist')
        cy.get('td').should('exist')
      })
    })
  })
})

// Run with: npx cypress run --spec cypress/e2e/multiple-waterfall.cy.ts
// Or: npx cypress open
