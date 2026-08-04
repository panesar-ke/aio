import * as React from "react";
import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Section,
  Tailwind,
  Text,
} from "react-email";

type ProductImportStatus = "completed" | "completed_with_errors" | "failed";

type Props = {
  fileName: string;
  status: ProductImportStatus;
  successRows: number;
  failedRows: number;
};

const STATUS_LABEL: Record<ProductImportStatus, string> = {
  completed: "completed successfully",
  completed_with_errors: "completed with some errors",
  failed: "failed",
};

export function ProductImportCompletedEmail({
  fileName,
  status,
  successRows,
  failedRows,
}: Props) {
  return (
    <Html lang="en" dir="ltr">
      <Tailwind>
        <Head />
        <Body className="bg-gray-100 font-sans py-10">
          <Container className="bg-white max-w-150 mx-auto rounded-xl overflow-hidden">
            <Section className="bg-gray-800 px-8 py-6">
              <Heading className="text-white text-[20px] font-bold m-0 text-center">
                Product Import {STATUS_LABEL[status]}
              </Heading>
            </Section>

            <Section className="px-8 py-8">
              <Text className="text-[16px] text-gray-700 mb-2">
                File: <strong>{fileName}</strong>
              </Text>
              <Text className="text-[16px] text-gray-700 mb-2">
                Products created: <strong>{successRows}</strong>
              </Text>
              <Text className="text-[16px] text-gray-700 mb-2">
                Rows failed: <strong>{failedRows}</strong>
              </Text>
              {failedRows > 0 && (
                <Text className="text-[14px] text-gray-500 mt-4">
                  Download the error report from the Recent Imports table to
                  see which rows need fixing, then re-upload just those rows.
                </Text>
              )}
            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
}
