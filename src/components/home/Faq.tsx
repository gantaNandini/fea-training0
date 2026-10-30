'use client'

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { SectionHeader } from '@/components/shared/SectionHeader'

const FAQ = [
  ['How soon can I start after paying?', 'Immediately. As soon as your payment is confirmed you are enrolled automatically and the course opens in My Courses. No one has to approve anything.'],
  ['What if my browser closes during payment?', 'Nothing is lost. The system re-checks with the payment gateway and enrols you automatically; just open My Courses.'],
  ['How long do I have access?', 'Lifetime. Once you buy a course you can watch it as often as you like.'],
  ['Do I need ANSYS to follow along?', 'It helps. Most courses are taught in ANSYS Mechanical and a student or trial licence is enough to follow the examples.'],
  ['Can I get a receipt for my company?', 'Yes. Every order has a printable receipt under your account, showing GST details.'],
  ['I have a question before buying. Who do I ask?', 'Use the Contact page and our team will get back to you.'],
]

export function Faq() {
  return (
    <section className="section-y" aria-labelledby="faq-heading">
      <div className="container-page max-w-3xl">
        <SectionHeader id="faq-heading" title="Frequently asked questions" />
        <Accordion type="single" collapsible>
          {FAQ.map(([q, a]) => (
            <AccordionItem key={q} value={q}>
              <AccordionTrigger>{q}</AccordionTrigger>
              <AccordionContent><p className="pb-4 text-muted-foreground">{a}</p></AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  )
}
